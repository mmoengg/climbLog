import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    collection,
    onSnapshot,
} from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

import MainLayout from "./components/MainLayout.jsx";
import AuthScreen from "./components/AuthScreen.jsx";
import HomeView from './views/HomeView.jsx';
import ExpenseView from "./views/ExpenseView.jsx";
import PassManagementView from "./views/PassManagementView.jsx";
import RecordView from "./views/RecordView.jsx";
import HistoryView from "./views/HistoryView.jsx";
import QuestHistoryView from "./views/QuestHistoryView.jsx";
import MoveView from "./views/MoveView.jsx";

// --- [Firebase 설정] ---
const getFirebaseConfig = () => {
    try {
        return {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID
        };
    } catch (e) { return { apiKey: "" }; }
};

const firebaseConfig = getFirebaseConfig();
let app;
if (!getApps().length && firebaseConfig.apiKey) app = initializeApp(firebaseConfig);
else app = getApp();

const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = 'climb-log-app';

export default function App() {
    const [activeTab, setActiveTab] = useState('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // 데이터 상태
    const [attendanceDays, setAttendanceDays] = useState([]);
    const [gearInfo, setGearInfo] = useState({});
    const [passes, setPasses] = useState([]);
    const [quests, setQuests] = useState([]);
    const [moves, setMoves] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [parkingInfo, setParkingInfo] = useState({});
    const [attendanceHistory, setAttendanceHistory] = useState({});
    const [questHistory, setQuestHistory] = useState({});
    const [expenses, setExpenses] = useState([]);

    const [passUsageHistory, setPassUsageHistory] = useState({});

    useEffect(() => {
        if (!auth) { setLoading(false); return; }
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user || !db) return;
        const userPath = ['artifacts', appId, 'users', user.uid];

        const unsubAttendance = onSnapshot(doc(db, ...userPath, 'data', 'attendance'), (docSnap) => setAttendanceDays(docSnap.data()?.days || []));

        const unsubPasses = onSnapshot(collection(db, ...userPath, 'passes'), (snapshot) => {
            const today = new Date();
            today.setHours(0,0,0,0);

            const loadedPasses = snapshot.docs.map(d => {
                const data = d.data();
                let calculatedDDay = data.dDay || 0;
                if (data.end) {
                    const endDate = new Date(data.end);
                    calculatedDDay = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                }
                return { id: d.id, ...data, dDay: calculatedDDay };
            });
            setPasses(loadedPasses);
        });

        const unsubQuests = onSnapshot(doc(db, ...userPath, 'data', 'quests'), (docSnap) => {
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.lastDate !== todayStr) {
                    const resetList = (data.list || []).map(q => ({ ...q, current: 0 }));
                    setDoc(doc(db, ...userPath, 'data', 'quests'), { list: resetList, lastDate: todayStr }, { merge: true });
                } else {
                    setQuests(data.list || []);
                }
            } else {
                const initialList = [
                    { id: 1, title: '오버행 벽 도전', goal: 3, current: 0, icon: 'Wind', color: 'bg-indigo-500' },
                    { id: 2, title: '안전한 매트 착지', goal: 5, current: 0, icon: 'Activity', color: 'bg-emerald-500' },
                    { id: 3, title: '옆 사람 나이스!', goal: 1, current: 0, icon: 'Smile', color: 'bg-amber-500' },
                ];
                setDoc(doc(db, ...userPath, 'data', 'quests'), { list: initialList, lastDate: todayStr }, { merge: true });
            }
        });

        const unsubMoves = onSnapshot(doc(db, ...userPath, 'data', 'moves'), (docSnap) => {
            if (docSnap.exists()) setMoves(docSnap.data()?.list || []);
            else setMoves([
                { id: 'm1', category: '발 쓰기', title: '인사이드 스텝', desc: '엄지발가락 안쪽 면 활용', level: 2, icon: 'Footprints' },
                { id: 'm2', category: '자세', title: '삼각대 자세', desc: '안정적인 삼각형 무게 중심', level: 3, icon: 'Activity' }
            ]);
        });

        const unsubSessions = onSnapshot(collection(db, ...userPath, 'sessions'), (snapshot) => {
            const s = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setSessions(s.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        });

        const unsubGear = onSnapshot(doc(db, ...userPath, 'data', 'gear'), (docSnap) => {
            setGearInfo(docSnap.data() || { name: '기본 암벽화', uses: 0, max: 100 });
        });

        const unsubParking = onSnapshot(doc(db, ...userPath, 'data', 'parking'), (docSnap) => {
            setParkingInfo(docSnap.data() || {});
        });

        const unsubHistory = onSnapshot(doc(db, ...userPath, 'data', 'attendanceHistory'), (docSnap) => {
            setAttendanceHistory(docSnap.data() || {});
        });

        const unsubQuestHistory = onSnapshot(doc(db, ...userPath, 'data', 'questHistory'), (docSnap) => {
            setQuestHistory(docSnap.data() || {});
        });

        const unsubExpenses = onSnapshot(collection(db, ...userPath, 'expenses'), (snapshot) => {
            const exp = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setExpenses(exp.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
        });

        const unsubPassUsage = onSnapshot(doc(db, ...userPath, 'data', 'passUsageHistory'), (docSnap) => {
            setPassUsageHistory(docSnap.data() || {});
        });

        return () => { unsubPasses(); unsubQuests(); unsubMoves(); unsubSessions(); unsubGear(); unsubParking(); unsubHistory(); unsubQuestHistory(); unsubExpenses(); unsubPassUsage(); };
    }, [user]);

    const uniqueBrands = useMemo(() => {
        const baseBrands = ["더클라임", "서울숲", "피커스", "클라이밍파크", "손상원", "알레"];
        const passBrands = passes.map(p => p.gym);
        return Array.from(new Set([...baseBrands, ...passBrands])).sort();
    }, [passes]);

    const uniqueGyms = useMemo(() => {
        const baseGyms = ["더클라임 신림", "더클라임 문래", "서울숲 구로", "피커스 종로", "손상원 강남"];
        const sessionGyms = sessions.map(s => s.gymName);
        const parkingGyms = Object.keys(parkingInfo);
        return Array.from(new Set([...baseGyms, ...sessionGyms, ...parkingGyms])).sort();
    }, [sessions, parkingInfo]);

    const handleSignOut = () => { if (auth) signOut(auth); setIsMenuOpen(false); };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-white text-blue-600 gap-4">
            <Loader2 className="animate-spin w-10 h-10" />
            <p className="font-bold uppercase animate-pulse">Climb Log Loading...</p>
        </div>
    );

    if (!user) return <AuthScreen auth={auth} />;

    return (
        <MainLayout
            user={user}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleSignOut={handleSignOut}
            isMenuOpen={isMenuOpen}
            setIsMenuOpen={setIsMenuOpen}
        >
            {activeTab === 'home' && <HomeView db={db} appId={appId} user={user} attendanceDays={attendanceDays} passes={passes} gearInfo={gearInfo} quests={quests} attendanceHistory={attendanceHistory} questHistory={questHistory} uniqueGyms={uniqueGyms} passUsageHistory={passUsageHistory} />}
            {activeTab === 'expenses' && <ExpenseView db={db} appId={appId} user={user} expenses={expenses} />}
            {activeTab === 'record' && <RecordView db={db} appId={appId} user={user} sessions={sessions} uniqueGyms={uniqueGyms} />}
            {activeTab === 'passes' && <PassManagementView db={db} appId={appId} user={user} passes={passes} uniqueBrands={uniqueBrands} uniqueGyms={uniqueGyms} parkingInfo={parkingInfo} />}
            {activeTab === 'history' && <HistoryView db={db} appId={appId} user={user} attendanceHistory={attendanceHistory} attendanceDays={attendanceDays} gearInfo={gearInfo} passes={passes} passUsageHistory={passUsageHistory} />}
            {activeTab === 'questHistory' && <QuestHistoryView db={db} appId={appId} quests={quests} questHistory={questHistory} />}
            {activeTab === 'moves' && <MoveView db={db} appId={appId} moves={moves} />}
        </MainLayout>
    );
}