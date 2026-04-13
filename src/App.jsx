import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from 'firebase/firestore';
import {
    Calendar, BookOpen, PenSquare, Home, Award, ChevronRight,
    CheckCircle2, MapPin, Search, Video, PlayCircle, Users,
    Activity, Ticket, Menu, X, Settings, LogOut, Edit3, Clock, Flame, Target, TrendingUp, Car, AlertCircle, Plus, MessageSquare, Sticker, Smile, Wind, History, Trophy, Footprints, Hand, ShieldCheck, Zap, ChevronDown, Loader2, Mail, Lock, Trash2, CalendarDays, Edit, Wallet, Receipt, PieChart, Coins, ChevronLeft
} from 'lucide-react';

// --- [Firebase 설정] ---
const getFirebaseConfig = () => {
    if (typeof __firebase_config !== 'undefined') return JSON.parse(__firebase_config);
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
const appId = typeof __app_id !== 'undefined' ? __app_id : 'climb-log-app';

// --- [공통 컴포넌트] ---
const NavItem = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center w-full pt-1 gap-1 transition-all ${isActive ? 'text-blue-600 scale-110 font-bold' : 'text-gray-400 font-medium'}`}>
        <div className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]' : ''}`}>{icon}</div>
        <span className="text-[9px] tracking-widest uppercase">{label}</span>
    </button>
);

// --- [암장별 레벨 데이터 & 색상 맵핑] ---
const GYM_LEVELS = {
    "더클라임": ["하양", "노랑", "주황", "초록", "파랑", "빨강", "보라", "회색", "갈색", "검정"],
    "서울숲": ["하양", "노랑", "초록", "파랑", "빨강", "보라", "회색", "검정"],
    "피커스": ["하양", "노랑", "주황", "초록", "파랑", "빨강", "보라", "검정"],
    "클라이밍파크": ["하양", "노랑", "초록", "파랑", "빨강", "보라", "회색", "검정"],
    "손상원": ["노랑", "초록", "파랑", "빨강", "보라", "회색", "검정", "흰색"],
    "기타": ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7"]
};

const LEVEL_COLORS = {
    "하양": "bg-gray-100 text-gray-800 border-gray-200",
    "흰색": "bg-gray-100 text-gray-800 border-gray-200",
    "노랑": "bg-yellow-300 text-yellow-900 border-yellow-400",
    "주황": "bg-orange-400 text-white border-orange-500",
    "초록": "bg-green-500 text-white border-green-600",
    "파랑": "bg-blue-500 text-white border-blue-600",
    "빨강": "bg-red-500 text-white border-red-600",
    "보라": "bg-purple-600 text-white border-purple-700",
    "회색": "bg-gray-500 text-white border-gray-600",
    "갈색": "bg-amber-800 text-white border-amber-900",
    "검정": "bg-gray-900 text-white border-gray-900"
};

const getLevelsForGym = (gymName) => {
    if (!gymName) return GYM_LEVELS["기타"];
    if (gymName.includes("더클라임")) return GYM_LEVELS["더클라임"];
    if (gymName.includes("서울숲")) return GYM_LEVELS["서울숲"];
    if (gymName.includes("피커스")) return GYM_LEVELS["피커스"];
    if (gymName.includes("클라이밍파크") || gymName.includes("클파")) return GYM_LEVELS["클라이밍파크"];
    if (gymName.includes("손상원")) return GYM_LEVELS["손상원"];
    return GYM_LEVELS["기타"];
};

// --- [메인 앱] ---
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

    // 💡 [추가] 출석 시 어떤 이용권을 썼는지 기록해두는 영수증 장부
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
            setSessions(s.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
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

        // 💡 [추가] 이용권 영수증 장부(passUsageHistory) 연동
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
            <p className="font-bold uppercase tracking-widest animate-pulse">Climb Log Loading...</p>
        </div>
    );

    if (!user) return <AuthScreen />;

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-800 font-sans max-w-md mx-auto shadow-[0_0_40px_rgba(0,0,0,0.05)] relative overflow-hidden text-left">

            {/* Sidebar Menu */}
            <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-black/50 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)} />
                <aside className={`absolute top-0 left-0 w-3/4 h-full bg-white shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 h-full flex flex-col">
                        <h2 className="text-xl font-black text-blue-600 border-b pb-4 mb-8 uppercase flex items-center gap-2"><Award /> Climb Log</h2>
                        <nav className="space-y-1 font-semibold flex-1 text-sm">
                            <button onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'home' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Home className="w-5 h-5" /> 대시보드</button>
                            <button onClick={() => { setActiveTab('expenses'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'expenses' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Wallet className="w-5 h-5" /> 클라이밍 가계부</button>
                            <button onClick={() => { setActiveTab('passes'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'passes' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Ticket className="w-5 h-5" /> 이용권 & 주차 관리</button>

                            <button onClick={() => { setActiveTab('history'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'history' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><History className="w-5 h-5" /> 출석 기록</button>
                            <button onClick={() => { setActiveTab('questHistory'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'questHistory' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Flame className="w-5 h-5" /> 퀘스트 기록</button>

                            <button onClick={() => { setActiveTab('moves'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'moves' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Trophy className="w-5 h-5" /> 무브 컬렉션</button>
                            <div className="h-[1px] bg-gray-100 my-4" />
                            <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-3 rounded-xl text-rose-500 hover:bg-rose-50"><LogOut className="w-5 h-5" /> 로그아웃</button>
                        </nav>
                    </div>
                </aside>
            </div>

            <header className="bg-white p-4 shadow-sm z-10 flex justify-between items-center border-b border-gray-100">
                <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><Menu className="w-6 h-6 text-gray-600" /></button>
                <h1 className="text-lg font-bold uppercase tracking-widest text-gray-800">
                    {activeTab === 'home' ? 'Dashboard' : activeTab === 'record' ? 'Training' : activeTab === 'passes' ? 'Tickets' : activeTab === 'history' ? 'History' : activeTab === 'questHistory' ? 'Quests' : activeTab === 'expenses' ? 'Wallet' : 'Moves'}
                </h1>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">{user?.email?.charAt(0)}</div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-24 bg-[#F8FAFC]">
                {/* passUsageHistory 전달 */}
                {activeTab === 'home' && <HomeView user={user} attendanceDays={attendanceDays} passes={passes} gearInfo={gearInfo} quests={quests} attendanceHistory={attendanceHistory} questHistory={questHistory} uniqueGyms={uniqueGyms} passUsageHistory={passUsageHistory} />}
                {activeTab === 'expenses' && <ExpenseView user={user} expenses={expenses} />}
                {activeTab === 'record' && <RecordView user={user} sessions={sessions} uniqueGyms={uniqueGyms} />}
                {activeTab === 'passes' && <PassManagementView user={user} passes={passes} uniqueBrands={uniqueBrands} uniqueGyms={uniqueGyms} parkingInfo={parkingInfo} />}
                {/* passUsageHistory, passes 전달 */}
                {activeTab === 'history' && <HistoryView user={user} attendanceHistory={attendanceHistory} attendanceDays={attendanceDays} gearInfo={gearInfo} passes={passes} passUsageHistory={passUsageHistory} />}
                {activeTab === 'questHistory' && <QuestHistoryView quests={quests} questHistory={questHistory} />}
                {activeTab === 'moves' && <MoveView moves={moves} />}
            </main>

            <nav className="bg-white flex justify-around p-2 pb-5 fixed bottom-0 w-full max-w-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <NavItem icon={<Home />} label="HOME" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                <NavItem icon={<Wallet />} label="WALLET" isActive={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
                <NavItem icon={<Ticket />} label="TICKETS" isActive={activeTab === 'passes'} onClick={() => setActiveTab('passes')} />
                <NavItem icon={<PenSquare />} label="TRAINING" isActive={activeTab === 'record'} onClick={() => setActiveTab('record')} />
            </nav>
        </div>
    );
}

// --- [AuthScreen] ---
const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        if (!auth) return;
        setLoading(true);
        try {
            if (isLogin) await signInWithEmailAndPassword(auth, email, password);
            else await createUserWithEmailAndPassword(auth, email, password);
        } catch (err) { setError('인증 실패! 이메일과 비밀번호를 확인해 주세요.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-[#F8FAFC]">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-700">
                <div className="text-center">
                    <div className="inline-flex p-4 bg-blue-600 rounded-3xl shadow-xl text-white mb-4"><Award className="w-10 h-10" /></div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase">Climb Log</h2>
                    <p className="text-gray-500 text-sm font-medium mt-2">나의 모든 성장을 데이터로 기록합니다</p>
                </div>
                <form onSubmit={handleAuth} className="space-y-4 text-left">
                    <div className="relative"><Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" /><input type="email" placeholder="Email" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                    <div className="relative"><Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" /><input type="password" placeholder="Password" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" value={password} onChange={e => setPassword(e.target.value)} required /></div>
                    {error && <p className="text-xs text-rose-500 font-semibold px-2">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold shadow-xl uppercase tracking-widest transition-all hover:bg-gray-800 disabled:opacity-50">
                        {loading ? <Loader2 className="animate-spin mx-auto w-5 h-5" /> : (isLogin ? '로그인' : '회원가입')}
                    </button>
                </form>
                <button onClick={() => setIsLogin(!isLogin)} className="w-full text-sm font-medium text-blue-600 underline underline-offset-4">{isLogin ? '처음이신가요? 계정 만들기' : '이미 계정이 있으신가요? 로그인'}</button>
            </div>
        </div>
    );
};

// --- [ExpenseView: 클라이밍 가계부] ---
const ExpenseView = ({ user, expenses }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [category, setCategory] = useState('입장권');
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');
    const [saving, setSaving] = useState(false);

    const getStartOfWeek = (d) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff)).toISOString().split('T')[0];
    };

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonthStr = todayStr.substring(0, 7);
    const startOfWeekStr = getStartOfWeek(new Date());

    const stats = useMemo(() => {
        let daily = 0, weekly = 0, monthly = 0, total = 0;

        expenses.forEach(e => {
            const val = Number(e.amount);
            total += val;
            if (e.date === todayStr) daily += val;
            if (e.date >= startOfWeekStr && e.date <= todayStr) weekly += val;
            if (e.date.startsWith(currentMonthStr)) monthly += val;
        });

        return { daily, weekly, monthly, total };
    }, [expenses, todayStr, currentMonthStr, startOfWeekStr]);

    const CATEGORY_STYLE = {
        "입장권": "bg-blue-100 text-blue-700",
        "주차비": "bg-gray-200 text-gray-700",
        "장비/의류": "bg-orange-100 text-orange-700",
        "간식/음료": "bg-green-100 text-green-700",
        "기타": "bg-purple-100 text-purple-700"
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user || !amount || !memo) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'expenses'), {
                date,
                category,
                amount: Number(amount),
                memo,
                createdAt: serverTimestamp()
            });
            setShowAddForm(false);
            setAmount('');
            setMemo('');
            setDate(new Date().toISOString().split('T')[0]);
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('기록을 삭제할까요? 통계에서 제외됩니다.')) return;
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'expenses', id));
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-10">
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest mb-4">
                    <PieChart className="w-5 h-5 text-blue-600" /> Expense Summary
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">일간 (오늘)</span>
                        <span className="text-lg font-black text-blue-700">{stats.daily.toLocaleString()}원</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">주간 (이번 주)</span>
                        <span className="text-lg font-black text-indigo-700">{stats.weekly.toLocaleString()}원</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 flex flex-col justify-center">
                        <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mb-1">월간 (이번 달)</span>
                        <span className="text-lg font-black text-purple-700">{stats.monthly.toLocaleString()}원</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-gray-900 border border-gray-800 flex flex-col justify-center shadow-md shadow-gray-300">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">총 누적 소비</span>
                        <span className="text-lg font-black text-white">{stats.total.toLocaleString()}원</span>
                    </div>
                </div>
            </section>

            <section className="bg-white p-5 rounded-3xl border-2 border-dashed border-gray-200 transition-all hover:bg-gray-50/50">
                <button onClick={() => setShowAddForm(!showAddForm)} className="w-full flex items-center justify-between font-bold text-gray-700 uppercase tracking-widest text-sm">
                    <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> 새 지출 기록하기</span>
                    <ChevronDown className={`transition-transform duration-300 ${showAddForm ? 'rotate-180' : ''}`} />
                </button>
                {showAddForm && (
                    <form onSubmit={handleSave} className="mt-5 space-y-4 animate-in slide-in-from-top-4">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm min-w-0">
                                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest shrink-0 mr-2">결제 날짜</label>
                                <input type="date" className="appearance-none bg-transparent outline-none text-sm font-bold text-gray-700 text-right w-full flex-1 min-w-0" value={date} onChange={e => setDate(e.target.value)} required />
                            </div>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full min-w-0 bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-700 shadow-sm">
                                <option value="입장권">입장권 (일일권/정기권)</option>
                                <option value="주차비">주차비/교통비</option>
                                <option value="장비/의류">장비/의류 (암벽화/초크 등)</option>
                                <option value="간식/음료">간식/음료/식비</option>
                                <option value="기타">기타 잡화</option>
                            </select>
                        </div>
                        <input type="number" placeholder="금액 입력 (원)" className="w-full min-w-0 bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-800 shadow-sm" value={amount} onChange={e => setAmount(e.target.value)} required />
                        <input placeholder="내역 메모 (예: 테이프 2개, 초크 리필)" className="w-full min-w-0 bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-700 shadow-sm" value={memo} onChange={e => setMemo(e.target.value)} required />
                        <button disabled={saving} className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-bold tracking-widest uppercase shadow-lg shadow-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50">
                            {saving ? '저장 중...' : '지출 저장하기 💸'}
                        </button>
                    </form>
                )}
            </section>

            <div className="space-y-3">
                <h3 className="text-[10px] text-gray-400 uppercase font-bold px-2 tracking-widest pt-2">Recent Expenses</h3>
                {expenses.map(e => (
                    <div key={e.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center group">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${CATEGORY_STYLE[e.category] || CATEGORY_STYLE["기타"]}`}>{e.category}</span>
                                <span className="text-[10px] font-bold text-gray-400">{e.date}</span>
                            </div>
                            <h4 className="font-bold text-sm text-gray-800 break-keep">{e.memo}</h4>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="font-black text-gray-900">{Number(e.amount).toLocaleString()}원</span>
                            <button onClick={() => handleDelete(e.id)} className="text-gray-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                ))}
                {expenses.length === 0 && (
                    <div className="w-full p-8 bg-gray-50 rounded-3xl border border-gray-100 text-center shadow-inner">
                        <Receipt className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">기록된 지출이 없습니다</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- [HomeView] ---
const HomeView = ({ user, attendanceDays, passes, gearInfo, quests, attendanceHistory, questHistory, uniqueGyms, passUsageHistory }) => {
    const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const today = new Date();

    const prevMonth = () => setCurrentCalendarDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentCalendarDate(new Date(year, month + 1, 1));

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();

    const isToday = (d) => {
        return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
    };

    const hasAttended = (d) => {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        return !!attendanceHistory[dateStr];
    };

    const monthlyAttendanceCount = useMemo(() => {
        const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
        return Object.keys(attendanceHistory).filter(dateKey => dateKey.startsWith(monthPrefix)).length;
    }, [attendanceHistory, year, month]);

    const totalVisits = Object.keys(attendanceHistory).length;

    const currentUses = gearInfo.uses !== undefined ? gearInfo.uses : (gearInfo.shoeUses || 0);
    const maxUses = gearInfo.max || 100;
    const shoeName = gearInfo.name || '기본 암벽화';
    const lifespanPercent = Math.max(0, 100 - Math.round((currentUses / maxUses) * 100));

    const [showCheckInOptions, setShowCheckInOptions] = useState(false);
    const [customAttGym, setCustomAttGym] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

    const [showShoeForm, setShowShoeForm] = useState(false);
    const [shoeNameInput, setShoeNameInput] = useState('');
    const [shoeMaxInput, setShoeMaxInput] = useState(100);

    const urgentPasses = useMemo(() => {
        return [...passes].sort((a, b) => a.dDay - b.dDay);
    }, [passes]);

    const handleAttendance = async (passId, gymName = null) => {
        if (!user || !attendanceDate) return;
        const userPath = ['artifacts', appId, 'users', user.uid];

        const selectedDay = new Date(attendanceDate).getDate();
        const newDays = Array.from(new Set([...attendanceDays, selectedDay]));

        await setDoc(doc(db, ...userPath, 'data', 'attendance'), { days: newDays }, { merge: true });
        await setDoc(doc(db, ...userPath, 'data', 'gear'), { ...gearInfo, uses: currentUses + 1 }, { merge: true });

        const finalGymName = (gymName && gymName.trim() !== '') ? gymName.trim() : '기본 출석';
        const dateKey = attendanceDate;

        const existingHistory = attendanceHistory[dateKey];
        const newHistoryEntry = existingHistory ? `${existingHistory}, ${finalGymName}` : finalGymName;
        await setDoc(doc(db, ...userPath, 'data', 'attendanceHistory'), { [dateKey]: newHistoryEntry }, { merge: true });

        // 💡 [수정] 티켓(pass)을 사용했을 때 영수증에 기록을 남깁니다.
        if (passId) {
            const pass = passes.find(p => p.id === passId);
            if (pass && pass.type === 'punch' && pass.remaining > 0) {
                // 잔여 횟수 차감
                await updateDoc(doc(db, ...userPath, 'passes', passId), { remaining: pass.remaining - 1 });

                // 영수증(passUsageHistory)에 "해당 날짜에 이 티켓 썼음" 기록 추가
                const existingUsage = passUsageHistory[dateKey] || [];
                await setDoc(doc(db, ...userPath, 'data', 'passUsageHistory'), {
                    [dateKey]: [...existingUsage, passId]
                }, { merge: true });
            }
        }
        setShowCheckInOptions(false);
        setCustomAttGym('');
        setAttendanceDate(new Date().toISOString().split('T')[0]);
    };

    const handleQuestClick = async (qId) => {
        if (!user) return;
        const userPath = ['artifacts', appId, 'users', user.uid];

        const quest = quests.find(q => q.id === qId);
        if (!quest) return;

        const newCurrent = Math.min(quest.goal, quest.current + 1);
        const newQuests = quests.map(q => q.id === qId ? { ...q, current: newCurrent } : q);
        await setDoc(doc(db, ...userPath, 'data', 'quests'), { list: newQuests }, { merge: true });

        if (quest.current < quest.goal && newCurrent === quest.goal) {
            const now = new Date();
            const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const existingHistory = questHistory[dateKey];
            const newHistoryEntry = existingHistory ? `${existingHistory}, ${quest.title}` : quest.title;

            await setDoc(doc(db, ...userPath, 'data', 'questHistory'), { [dateKey]: newHistoryEntry }, { merge: true });
        }
    };

    const handleRegisterShoe = async (e) => {
        e.preventDefault();
        if (!user || !shoeNameInput) return;
        const userPath = ['artifacts', appId, 'users', user.uid];

        await setDoc(doc(db, ...userPath, 'data', 'gear'), {
            name: shoeNameInput,
            uses: 0,
            max: Number(shoeMaxInput)
        }, { merge: true });

        setShowShoeForm(false);
        setShoeNameInput('');
        setShoeMaxInput(100);
    };

    const getQuestIcon = (name) => {
        if (name === 'Wind') return <Wind className="w-5 h-5" />;
        if (name === 'Activity') return <Activity className="w-5 h-5" />;
        return <Smile className="w-5 h-5" />;
    };

    const todayDateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const isAttendedTodayForButton = !!attendanceHistory[todayDateStr];

    return (
        <div className="space-y-5 animate-in fade-in duration-700">
            {/* 1. 캘린더 및 직관적인 출석 버튼 */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-5">
                    <div className="flex items-center gap-2">
                        <button onClick={prevMonth} className="p-1 text-gray-400 hover:text-blue-600 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
                        <h3 className="font-black text-gray-800 text-sm w-16 text-center">{month + 1}월</h3>
                        <button onClick={nextMonth} className="p-1 text-gray-400 hover:text-blue-600 transition-colors"><ChevronRight className="w-5 h-5" /></button>
                    </div>

                    <div className="flex gap-1.5 items-center">
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md">{month + 1}월 {monthlyAttendanceCount}회</span>
                        <span className="text-[10px] font-bold text-white bg-blue-600 px-2.5 py-1 rounded-md shadow-sm">총 누적 {totalVisits}회</span>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-6 font-bold text-gray-400">
                    {['일','월','화','수','목','금','토'].map(d => <div key={d} className="mb-2">{d}</div>)}

                    {Array.from({ length: firstDayOfWeek }, (_, i) => <div key={`blank-${i}`} />)}

                    {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const attended = hasAttended(day);
                        const isTodayFlag = isToday(day);
                        return (
                            <div key={day} className={`aspect-square flex items-center justify-center rounded-2xl text-xs transition-all cursor-pointer hover:scale-110 ${attended ? 'bg-blue-600 text-white font-bold shadow-md' : isTodayFlag ? 'border-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-600 font-medium hover:bg-gray-100'}`}>
                                {day}
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4">
                    {!showCheckInOptions ? (
                        <button onClick={() => setShowCheckInOptions(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold tracking-widest shadow-xl hover:bg-blue-700 transition-all uppercase flex items-center justify-center gap-2">
                            {isAttendedTodayForButton ? '한 번 더 출석하기 🐾' : '출석 체크하기 🐾'}
                        </button>
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">출석 날짜 및 방법 선택</span>
                                <button onClick={() => { setShowCheckInOptions(false); setAttendanceDate(new Date().toISOString().split('T')[0]); }} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full shadow-sm"><X className="w-4 h-4" /></button>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-gray-200 mb-3 shadow-sm flex items-center justify-between min-w-0">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0 mr-2">출석 날짜</label>
                                <input
                                    type="date"
                                    className="appearance-none bg-transparent outline-none text-sm font-bold text-gray-700 text-right w-full flex-1 min-w-0"
                                    value={attendanceDate}
                                    onChange={e => setAttendanceDate(e.target.value)}
                                />
                            </div>

                            {passes.filter(p => p.remaining > 0 || p.type === 'period').length > 0 && (
                                <div className="space-y-2">
                                    {passes.filter(p => p.remaining > 0 || p.type === 'period').map(p => (
                                        <button key={p.id} onClick={() => handleAttendance(p.id, p.gym)} className="w-full p-4 bg-white border border-blue-100 text-blue-600 rounded-xl font-bold shadow-sm hover:bg-blue-50 transition-all flex justify-between items-center">
                                            <span className="text-sm">{p.gym} <span className="text-xs font-medium text-blue-400">({p.name})</span></span>
                                            <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> 사용</span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3 mt-3">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">이용권 없이 기본 출석 (직접 입력)</p>
                                <div className="space-y-2">
                                    <input
                                        placeholder="방문한 지점명 직접 입력 (예: 더클라임 연남)"
                                        className="w-full min-w-0 bg-gray-50 p-3 rounded-lg border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-700"
                                        value={customAttGym}
                                        onChange={e => setCustomAttGym(e.target.value)}
                                    />
                                    <button
                                        onClick={() => handleAttendance(null, customAttGym)}
                                        className="w-full py-3 mt-1 bg-gray-800 text-white rounded-lg font-bold text-sm shadow-md hover:bg-gray-700 transition-colors"
                                    >
                                        {customAttGym.trim() === '' ? '기본 출석하기' : '이 지점으로 출석하기'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 2. 마이크로 퀘스트 */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest mb-4">
                    <Flame className="w-5 h-5 text-orange-500" /> Daily Micro-Quests
                </h3>

                <div className="grid grid-cols-3 gap-3">
                    {quests && quests.length > 0 ? quests.map(q => (
                        <button
                            key={q.id}
                            onClick={() => handleQuestClick(q.id)}
                            className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${q.current === q.goal ? `${q.color} text-white shadow-lg border-transparent` : 'bg-white text-gray-500 border-gray-100 hover:border-gray-200'}`}
                        >
                            {q.current === q.goal ? <CheckCircle2 className="w-6 h-6 mb-1" /> : getQuestIcon(q.icon)}
                            <p className="text-[10px] font-bold mt-2 text-center px-1 leading-tight">{q.title}</p>
                            <div className="mt-1.5 flex gap-1">
                                {Array.from({ length: q.goal }).map((_, i) => (
                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < q.current ? (q.current === q.goal ? 'bg-white' : 'bg-blue-500') : 'bg-gray-200'}`} />
                                ))}
                            </div>
                        </button>
                    )) : (
                        <p className="col-span-3 text-center text-xs text-gray-400 py-4">퀘스트 데이터를 불러오는 중입니다.</p>
                    )}
                </div>
            </section>

            {/* 3. 이용권 지갑 (메인 화면에서는 간략하게 표시) */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                {urgentPasses.map(p => (
                    <div key={p.id} className={`min-w-[270px] p-5 rounded-3xl border transition-all relative overflow-hidden ${p.type === 'period' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <Ticket className={`absolute -right-4 -bottom-4 w-24 h-24 ${p.type === 'period' ? 'opacity-10 text-white' : 'opacity-5 text-gray-900'}`} />
                        <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${p.type === 'period' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>{p.name}</span>
                            <div className={`text-xs font-black ${p.dDay < 7 ? 'text-rose-500 animate-pulse' : (p.type === 'period' ? 'text-blue-100' : 'text-blue-600')}`}>D-{p.dDay}</div>
                        </div>
                        <h4 className="font-bold text-lg uppercase mb-2 tracking-tight">{p.gym}</h4>
                        <p className={`text-[10px] font-semibold tracking-wide flex items-center gap-1 ${p.type === 'period' ? 'text-blue-200' : 'text-gray-400'}`}>
                            <CalendarDays className="w-3 h-3" /> {p.end} 까지
                        </p>

                        {p.type === 'punch' && (
                            <div className="mt-5 space-y-2">
                                <div className="flex justify-between text-[10px] font-bold">
                                    <span className={`${p.type === 'period' ? 'text-white' : 'text-gray-400'} uppercase tracking-widest`}>Remaining</span>
                                    <span className={`${p.type === 'period' ? 'text-white' : 'text-orange-600'}`}>{p.remaining} / {p.total}</span>
                                </div>
                                <div className="flex gap-1 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="bg-orange-400 h-full transition-all duration-500 ease-out" style={{ width: `${(p.remaining/p.total)*100}%` }} />
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {passes.length === 0 && (
                    <div className="min-w-full p-8 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center shadow-inner">
                        <Ticket className="w-8 h-8 text-gray-300 mb-3" />
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">등록된 이용권이 없습니다</p>
                    </div>
                )}
            </div>

            {/* 5. 암벽화 수명 관리 */}
            <section className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                {!showShoeForm ? (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border-2 ${lifespanPercent < 30 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
                                {lifespanPercent}%
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-gray-800 flex items-center gap-1">
                                    {shoeName}
                                </h4>
                                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
                                    수명: {currentUses} / {maxUses} Climbs
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowShoeForm(true)} className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-gray-100">
                            <Edit className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleRegisterShoe} className="space-y-3 animate-in fade-in slide-in-from-right-4">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                            <h4 className="text-xs font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2"><Footprints className="w-4 h-4 text-blue-600"/> 새 암벽화 등록</h4>
                            <button type="button" onClick={() => setShowShoeForm(false)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-4 h-4" /></button>
                        </div>
                        <input
                            placeholder="암벽화 이름 (예: VSR, 드론)"
                            className="w-full min-w-0 bg-gray-50 p-3 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800"
                            value={shoeNameInput}
                            onChange={e => setShoeNameInput(e.target.value)}
                            required
                        />
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 min-w-0">
                            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest shrink-0">예상 수명(출석 횟수)</label>
                            <input
                                type="number"
                                className="bg-white min-w-0 p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold w-20 text-center shadow-sm"
                                value={shoeMaxInput}
                                onChange={e => setShoeMaxInput(e.target.value)}
                                min="1"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-xs tracking-widest uppercase shadow-md hover:bg-gray-800 transition-colors">
                            등록하고 사용 횟수 0으로 초기화
                        </button>
                    </form>
                )}
            </section>
        </div>
    );
};

// --- [RecordView] ---
const RecordView = ({ user, sessions, uniqueGyms }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedGym, setSelectedGym] = useState(uniqueGyms[0] || '');
    const [customGym, setCustomGym] = useState('');
    const [newLevel, setNewLevel] = useState('');
    const [newSummary, setNewSummary] = useState('');
    const [saving, setSaving] = useState(false);

    const sessionBrands = useMemo(() => {
        const brands = sessions.map(s => s.gymName.split(' ')[0]);
        return Array.from(new Set(brands));
    }, [sessions]);

    const [chartBrandFilter, setChartBrandFilter] = useState('더클라임');

    useEffect(() => {
        if (sessionBrands.length > 0 && !sessionBrands.includes(chartBrandFilter)) {
            setChartBrandFilter(sessionBrands[0]);
        }
    }, [sessionBrands]);

    const finalGymName = selectedGym === 'manual' ? customGym.trim() : selectedGym;
    const currentGymLevels = getLevelsForGym(finalGymName);

    const highestRecords = useMemo(() => {
        const records = {};
        sessions.forEach(s => {
            const brand = s.gymName.split(' ')[0];
            const levels = getLevelsForGym(s.gymName);
            const idx = levels.indexOf(s.topLevel);

            if (!records[brand] || records[brand].idx < idx) {
                records[brand] = { level: s.topLevel, idx, date: s.date, fullGymName: s.gymName };
            }
        });
        return Object.entries(records).sort((a, b) => b[1].idx - a[1].idx);
    }, [sessions]);

    const chartData = useMemo(() => {
        const filteredSessions = [...sessions]
            .filter(s => s.gymName.startsWith(chartBrandFilter))
            .sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
            .slice(-7);

        if (filteredSessions.length === 0) return null;

        const levels = getLevelsForGym(chartBrandFilter);
        const height = 150;
        const yStep = height / Math.max(1, levels.length - 1);
        const xStep = filteredSessions.length > 1 ? 260 / (filteredSessions.length - 1) : 0;

        return {
            levels,
            yStep,
            points: filteredSessions.map((s, i) => {
                const idx = levels.indexOf(s.topLevel);
                const safeIdx = idx !== -1 ? idx : 0;
                return {
                    x: filteredSessions.length === 1 ? 170 : 50 + (i * xStep),
                    y: height - (safeIdx * yStep),
                    val: s.topLevel,
                    date: s.date.replace(/[^0-9]/g, '').slice(-4).replace(/(\d{2})(\d{2})/, '$1/$2')
                };
            })
        };
    }, [sessions, chartBrandFilter]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user || !newLevel || !finalGymName) return;
        setSaving(true);
        try {
            const now = new Date();
            const yyyymmdd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sessions'), {
                gymName: finalGymName,
                topLevel: newLevel,
                summary: newSummary,
                date: yyyymmdd,
                createdAt: serverTimestamp()
            });
            setShowAddForm(false);
            setNewSummary('');
            setCustomGym('');
            setNewLevel('');
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-10">

            <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest mb-4">
                    <Trophy className="w-5 h-5 text-amber-500" /> Best Records per Gym
                </h3>
                {highestRecords.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                        {highestRecords.map(([brand, data]) => (
                            <div key={brand} className={`p-3 rounded-2xl border flex flex-col justify-center items-center shadow-sm ${LEVEL_COLORS[data.level] || 'bg-gray-50 text-gray-800 border-gray-200'}`}>
                                <span className="text-[10px] opacity-80 font-bold mb-1 tracking-widest">{brand}</span>
                                <span className="text-lg font-black">{data.level}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center py-6 text-gray-400 text-xs font-medium bg-gray-50 rounded-2xl">기록된 데이터가 없습니다.</p>
                )}
            </section>

            <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest">
                        <TrendingUp className="w-5 h-5 text-blue-600" /> Growth Chart
                    </h3>
                    {sessionBrands.length > 0 && (
                        <select
                            value={chartBrandFilter}
                            onChange={(e) => setChartBrandFilter(e.target.value)}
                            className="text-xs font-bold text-blue-700 bg-blue-50 border-none outline-none rounded-lg px-2 py-1 cursor-pointer min-w-0"
                        >
                            {sessionBrands.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    )}
                </div>

                <div className="w-full bg-gray-50 rounded-2xl p-4 overflow-x-auto scrollbar-hide border border-gray-100/50">
                    {chartData ? (
                        <svg width="320" height="190" className="mx-auto overflow-visible">
                            {chartData.levels.map((lv, i) => {
                                const yPos = 150 - i * chartData.yStep;
                                return (
                                    <g key={lv}>
                                        <text x="40" y={yPos + 3} textAnchor="end" className="text-[8px] fill-gray-500 font-bold">{lv}</text>
                                        <line x1="45" y1={yPos} x2="310" y2={yPos} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
                                    </g>
                                );
                            })}

                            {chartData.points.length > 1 && (
                                <path d={`M ${chartData.points[0].x} ${chartData.points[0].y} ${chartData.points.map(p => `L ${p.x} ${p.y}`).join(' ')}`} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                            )}

                            {chartData.points.map((p, i) => (
                                <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="4" fill="#2563EB" stroke="white" strokeWidth="1.5" />
                                    <text x={p.x} y={165} textAnchor="middle" className="text-[8px] fill-gray-400 font-bold">{p.date}</text>
                                </g>
                            ))}
                        </svg>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-400 text-xs font-medium">[{chartBrandFilter}]의 기록이 없거나 부족합니다.</p>
                            <p className="text-gray-300 text-[10px] mt-1">성장 흐름을 보려면 최소 1회 이상의 기록이 필요해요.</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-white p-5 rounded-3xl border-2 border-dashed border-blue-200 transition-all hover:bg-blue-50/50">
                <button onClick={() => setShowAddForm(!showAddForm)} className="w-full flex items-center justify-between font-bold text-blue-600 uppercase tracking-widest text-sm">
                    <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> 새 하이라이트 추가하기</span>
                    <ChevronDown className={`transition-transform duration-300 ${showAddForm ? 'rotate-180' : ''}`} />
                </button>
                {showAddForm && (
                    <form onSubmit={handleSave} className="mt-5 space-y-4 animate-in slide-in-from-top-4">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 ml-1">방문한 지점 선택</label>
                            <select value={selectedGym} onChange={e => setSelectedGym(e.target.value)} className="w-full min-w-0 bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-700 shadow-sm">
                                {uniqueGyms.map(g => <option key={g} value={g}>{g}</option>)}
                                <option value="manual">직접 입력 (+)</option>
                            </select>
                            {selectedGym === 'manual' && (
                                <input placeholder="새로운 방문 지점명 입력 (예: 손상원 강남)" className="w-full min-w-0 bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-700 shadow-sm" value={customGym} onChange={e => setCustomGym(e.target.value)} required />
                            )}
                            <select value={newLevel} onChange={e => setNewLevel(e.target.value)} className="w-full min-w-0 bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-700 shadow-sm" required>
                                <option value="">성공한 문제의 레벨을 선택하세요</option>
                                {currentGymLevels.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                            </select>
                        </div>
                        <textarea placeholder="오늘의 하이라이트 무브나 피드백을 자유롭게 기록하세요! (하루에 여러 개 작성 가능)" className="w-full min-w-0 bg-white p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium h-28 shadow-sm placeholder:text-gray-400 leading-relaxed" value={newSummary} onChange={e => setNewSummary(e.target.value)} />
                        <button disabled={saving} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold tracking-widest uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {saving ? '저장 중...' : '기록 저장하기 🧗'}
                        </button>
                    </form>
                )}
            </section>

            <div className="space-y-4">
                <h3 className="text-[10px] text-gray-400 uppercase font-bold px-2 tracking-widest pt-2">My Highlights</h3>
                {sessions.map(s => (
                    <div key={s.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.date}</span>
                                <h4 className="font-bold text-gray-800 text-sm uppercase mt-0.5">{s.gymName}</h4>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border ${LEVEL_COLORS[s.topLevel] || 'bg-gray-100 text-gray-800'}`}>
                      {s.topLevel}
                    </span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50 p-3 rounded-xl">"{s.summary}"</p>
                    </div>
                ))}
                {sessions.length === 0 && (
                    <div className="w-full p-8 bg-gray-50 rounded-3xl border border-gray-100 text-center shadow-inner">
                        <PenSquare className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">기록된 하이라이트가 없습니다</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- [PassManagementView] ---
const PassManagementView = ({ user, passes, uniqueBrands, uniqueGyms, parkingInfo }) => {
    const [selectedBrand, setSelectedBrand] = useState(uniqueBrands[0] || '');
    const [customBrand, setCustomBrand] = useState('');

    const [type, setType] = useState('punch');
    const [total, setTotal] = useState(10);
    const [months, setMonths] = useState(1);

    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState('');

    const [savingPass, setSavingPass] = useState(false);

    const [selectedParkGym, setSelectedParkGym] = useState(uniqueGyms[0] || '');
    const [customParkGym, setCustomParkGym] = useState('');
    const [parkingMemo, setParkingMemo] = useState('');
    const [savingPark, setSavingPark] = useState(false);

    useEffect(() => {
        if (startDate) {
            const d = new Date(startDate);
            if (type === 'period') {
                d.setMonth(d.getMonth() + months);
            } else {
                d.setMonth(d.getMonth() + 6);
            }
            setEndDate(d.toISOString().split('T')[0]);
        }
    }, [startDate, months, type]);

    const resetForm = () => {
        setSelectedBrand(uniqueBrands[0]);
        setCustomBrand('');
        setType('punch');
        setTotal(10);
        setMonths(1);
        setStartDate(new Date().toISOString().split('T')[0]);
    };

    const handleAddPass = async (e) => {
        e.preventDefault();
        const finalBrandName = selectedBrand === 'manual' ? customBrand.trim() : selectedBrand;
        if (!user || !finalBrandName || !startDate || !endDate) return;
        setSavingPass(true);

        const autoGeneratedName = type === 'punch' ? `${total}회권` : `${months}개월권`;

        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'passes'), {
                gym: finalBrandName,
                name: autoGeneratedName,
                type,
                start: startDate,
                end: endDate,
                total: type === 'punch' ? Number(total) : null,
                remaining: type === 'punch' ? Number(total) : null,
                dDay: 0
            });
            resetForm();
        } catch (err) { console.error(err); }
        finally { setSavingPass(false); }
    };

    const handleDeletePass = async (id) => {
        if (!window.confirm('이용권을 삭제하시겠습니까?')) return;
        await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'passes', id));
    };

    const handleSaveParking = async (e) => {
        e.preventDefault();
        const finalParkGym = selectedParkGym === 'manual' ? customParkGym.trim() : selectedParkGym;
        if (!user || !finalParkGym || !parkingMemo) return;
        setSavingPark(true);
        try {
            const newParking = { ...parkingInfo, [finalParkGym]: parkingMemo };
            await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'parking'), newParking, { merge: true });
            setCustomParkGym(''); setParkingMemo(''); setSelectedParkGym(uniqueGyms[0]);
        } catch (err) { console.error(err); }
        finally { setSavingPark(false); }
    };

    const handleDeleteParking = async (gymToDelete) => {
        if (!window.confirm('이 지점의 주차 정보를 삭제할까요?')) return;
        const newParking = { ...parkingInfo };
        delete newParking[gymToDelete];
        await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'data', 'parking'), newParking);
    };

    return (
        <div className="space-y-8 animate-in fade-in pb-10">
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2">
                        <Ticket className="w-5 h-5 text-gray-800" />
                        티켓 등록 관리
                    </h3>
                </div>

                <form onSubmit={handleAddPass} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">브랜드 선택 (공통 사용)</label>
                        <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="w-full min-w-0 bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800">
                            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                            <option value="manual">직접 입력 (+)</option>
                        </select>
                    </div>
                    {selectedBrand === 'manual' && (
                        <input placeholder="새로운 브랜드명 (예: 알레)" className="w-full min-w-0 bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800 animate-in slide-in-from-top-2" value={customBrand} onChange={e => setCustomBrand(e.target.value)} required />
                    )}

                    <div className="space-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">이용권 종류</label>
                            <select value={type} onChange={e => setType(e.target.value)} className="w-full min-w-0 bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800">
                                <option value="punch">횟수권</option>
                                <option value="period">기간권</option>
                            </select>
                        </div>

                        {type === 'punch' ? (
                            <div className="space-y-2 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                                <div className="flex items-center justify-between mb-3 bg-white p-3 rounded-xl border border-orange-100 shadow-sm min-w-0">
                                    <label className="text-[10px] text-orange-800 font-bold uppercase tracking-widest shrink-0 mr-2">전체 횟수 설정</label>
                                    <select value={total} onChange={e => setTotal(Number(e.target.value))} className="bg-transparent outline-none text-xs font-bold text-orange-700 min-w-0 text-right">
                                        <option value={5}>5회</option>
                                        <option value={10}>10회</option>
                                        <option value={15}>15회</option>
                                        <option value={20}>20회</option>
                                        <option value={30}>30회</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm min-w-0">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest shrink-0 mr-2">구매일</label>
                                    <input type="date" className="appearance-none bg-transparent outline-none text-sm font-bold text-gray-700 text-right w-full flex-1 min-w-0" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                                </div>
                                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-rose-200 shadow-sm min-w-0">
                                    <label className="text-[10px] text-rose-500 font-bold uppercase tracking-widest shrink-0 mr-2">유효기간 (만료일)</label>
                                    <input type="date" className="appearance-none bg-transparent outline-none text-sm font-bold text-rose-700 text-right w-full flex-1 min-w-0" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                <div className="flex items-center justify-between mb-3 bg-white p-3 rounded-xl border border-blue-100 shadow-sm min-w-0">
                                    <label className="text-[10px] text-blue-800 font-bold uppercase tracking-widest shrink-0 mr-2">기간 설정</label>
                                    <select value={months} onChange={e => setMonths(Number(e.target.value))} className="bg-transparent outline-none text-xs font-bold text-blue-700 min-w-0 text-right">
                                        <option value={1}>1개월</option>
                                        <option value={3}>3개월</option>
                                        <option value={6}>6개월</option>
                                        <option value={12}>12개월</option>
                                    </select>
                                </div>
                                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm min-w-0">
                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-widest shrink-0 mr-2">시작일</label>
                                    <input type="date" className="appearance-none bg-transparent outline-none text-sm font-bold text-gray-700 text-right w-full flex-1 min-w-0" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                                </div>
                                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-rose-200 shadow-sm min-w-0">
                                    <label className="text-[10px] text-rose-500 font-bold uppercase tracking-widest shrink-0 mr-2">만료일 (자동계산)</label>
                                    <input type="date" className="appearance-none bg-transparent outline-none text-sm font-bold text-rose-700 text-right w-full flex-1 min-w-0" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                                </div>
                            </div>
                        )}
                    </div>

                    <button disabled={savingPass} className={`w-full py-4 mt-2 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 bg-gray-900 hover:bg-gray-800`}>
                        {savingPass ? '처리 중...' : 'REGISTER TICKET 💳'}
                    </button>
                </form>

                <div className="mt-8 space-y-3">
                    <h3 className="text-[10px] text-gray-400 uppercase font-bold px-2 tracking-widest mb-3 border-t border-gray-100 pt-6">All Registered Tickets</h3>
                    {passes.map(p => (
                        <div key={p.id} className={`p-4 rounded-2xl border flex justify-between items-center transition-all bg-gray-50 border-gray-100 min-w-0`}>
                            <div className="flex-1 min-w-0 pr-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${p.type === 'period' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>{p.type === 'period' ? '기간권' : '횟수권'}</span>
                                    <h4 className="text-sm font-bold text-gray-800 truncate">{p.gym}</h4>
                                </div>
                                <p className="text-[11px] text-gray-800 font-bold mt-1.5 flex items-center gap-1">
                                    {p.name} {p.type === 'punch' && <span className="text-orange-500 ml-1">({p.remaining}회 남음)</span>}
                                </p>
                                {p.start && p.end && (
                                    <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1 truncate">
                                        <CalendarDays className="w-3 h-3 shrink-0" /> {p.start} ~ <span className="text-rose-500 font-bold">{p.end}</span>
                                    </p>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 shrink-0">
                                <button onClick={() => handleDeletePass(p.id)} className="text-gray-400 hover:text-rose-500 bg-white p-2 rounded-xl shadow-sm border border-gray-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                    {passes.length === 0 && <p className="text-center text-xs text-gray-400 py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">등록된 이용권이 없습니다.</p>}
                </div>
            </section>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" /> 지점별 주차장 관리
                </h3>
                <form onSubmit={handleSaveParking} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">방문하는 지점 선택</label>
                        <select value={selectedParkGym} onChange={e => setSelectedParkGym(e.target.value)} className="w-full min-w-0 bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800">
                            {uniqueGyms.map(g => <option key={g} value={g}>{g}</option>)}
                            <option value="manual">직접 입력 (+)</option>
                        </select>
                    </div>
                    {selectedParkGym === 'manual' && (
                        <input placeholder="새로운 지점명 입력 (예: 더클라임 신림)" className="w-full min-w-0 bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800 animate-in slide-in-from-top-2" value={customParkGym} onChange={e => setCustomParkGym(e.target.value)} required />
                    )}

                    <input placeholder="해당 지점의 주차 조건 (예: 건물 지하 불가)" className="w-full min-w-0 bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800" value={parkingMemo} onChange={e => setParkingMemo(e.target.value)} required />

                    <button disabled={savingPark} className="w-full py-4 mt-2 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {savingPark ? '저장 중...' : 'SAVE PARKING INFO 🚗'}
                    </button>
                </form>

                <div className="mt-6 space-y-2">
                    <h3 className="text-[10px] text-gray-400 uppercase font-bold px-2 tracking-widest mb-3 border-t border-gray-100 pt-6">Saved Parking Infos</h3>
                    {Object.entries(parkingInfo).map(([gymName, info]) => (
                        <div key={gymName} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center min-w-0">
                            <div className="min-w-0 pr-2">
                                <h4 className="text-sm font-bold text-gray-800 truncate">{gymName}</h4>
                                <p className="text-[11px] text-blue-600 font-bold mt-0.5 truncate">{info}</p>
                            </div>
                            <button onClick={() => handleDeleteParking(gymName)} className="text-gray-400 hover:text-rose-500 hover:bg-white p-2 rounded-xl transition-colors shadow-sm shrink-0"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {Object.keys(parkingInfo).length === 0 && <p className="text-center text-xs text-gray-400 py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">저장된 주차 정보가 없습니다.</p>}
                </div>
            </section>

        </div>
    );
};

// --- [HistoryView: 영수증 복원 로직 추가] ---
const HistoryView = ({ user, attendanceHistory, attendanceDays, gearInfo, passes, passUsageHistory }) => {
    const [editingDateKey, setEditingDateKey] = useState(null);
    const [editDate, setEditDate] = useState('');
    const [editGymName, setEditGymName] = useState('');
    const [saving, setSaving] = useState(false);

    const sortedDates = Object.keys(attendanceHistory).sort((a, b) => {
        if (a.includes('-') && b.includes('-')) return b.localeCompare(a);
        return String(b).localeCompare(String(a));
    });

    const handleEditClick = (dateKey, gymName) => {
        setEditingDateKey(dateKey);
        if (dateKey.includes('-')) {
            setEditDate(dateKey);
        } else {
            const now = new Date();
            setEditDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${dateKey.padStart(2, '0')}`);
        }
        setEditGymName(gymName);
    };

    const handleEditSave = async (oldDateKey) => {
        if (!user || !editDate || !editGymName) return;
        setSaving(true);
        try {
            const newHistory = { ...attendanceHistory };
            delete newHistory[oldDateKey];

            if (newHistory[editDate]) {
                newHistory[editDate] += `, ${editGymName}`;
            } else {
                newHistory[editDate] = editGymName;
            }

            const userPath = ['artifacts', appId, 'users', user.uid];
            await setDoc(doc(db, ...userPath, 'data', 'attendanceHistory'), newHistory);

            if (oldDateKey !== editDate) {
                const oldD = new Date(oldDateKey.includes('-') ? oldDateKey : new Date().setDate(oldDateKey));
                const newD = new Date(editDate);
                const today = new Date();
                let newDays = [...attendanceDays];

                if (oldD.getMonth() === today.getMonth() && oldD.getFullYear() === today.getFullYear()) {
                    newDays = newDays.filter(d => d !== oldD.getDate());
                }
                if (newD.getMonth() === today.getMonth() && newD.getFullYear() === today.getFullYear()) {
                    if (!newDays.includes(newD.getDate())) newDays.push(newD.getDate());
                }
                await setDoc(doc(db, ...userPath, 'data', 'attendance'), { days: newDays }, { merge: true });

                // 💡 [추가] 날짜를 수정하면 해당 날짜의 영수증(사용 기록)도 새 날짜로 이동!
                if (passUsageHistory[oldDateKey]) {
                    const newPassUsage = { ...passUsageHistory };
                    const movedPasses = newPassUsage[oldDateKey];
                    delete newPassUsage[oldDateKey];

                    newPassUsage[editDate] = [...(newPassUsage[editDate] || []), ...movedPasses];
                    await setDoc(doc(db, ...userPath, 'data', 'passUsageHistory'), newPassUsage);
                }
            }
            setEditingDateKey(null);
        } catch(e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleDelete = async (dateKey) => {
        if (!window.confirm(`${dateKey} 출석 기록을 완전히 삭제하시겠습니까? (사용했던 티켓 횟수와 신발 수명이 복구됩니다)`)) return;
        try {
            const userPath = ['artifacts', appId, 'users', user.uid];

            // 💡 [핵심 추가] 이 날짜에 사용했던 티켓(영수증)이 있는지 확인하고 복구(환불)합니다.
            const usedPasses = passUsageHistory[dateKey];
            if (usedPasses && usedPasses.length > 0) {
                for (const pId of usedPasses) {
                    const passToRestore = passes.find(p => p.id === pId);
                    // 횟수권인 경우에만 잔여 횟수를 +1 시켜서 돌려줌
                    if (passToRestore && passToRestore.type === 'punch') {
                        // 단, 실수로 원래 전체 횟수(total)를 넘지 않도록 안전장치 적용
                        const restoredRemaining = Math.min(passToRestore.total, passToRestore.remaining + 1);
                        await updateDoc(doc(db, ...userPath, 'passes', pId), { remaining: restoredRemaining });
                    }
                }
                // 환불을 마쳤으니 해당 날짜의 영수증 장부 파기
                const newPassUsage = { ...passUsageHistory };
                delete newPassUsage[dateKey];
                await setDoc(doc(db, ...userPath, 'data', 'passUsageHistory'), newPassUsage);
            }

            const newHistory = { ...attendanceHistory };
            const gymsCount = newHistory[dateKey].split(',').length;
            delete newHistory[dateKey];
            await setDoc(doc(db, ...userPath, 'data', 'attendanceHistory'), newHistory);

            const currentUses = gearInfo.uses !== undefined ? gearInfo.uses : (gearInfo.shoeUses || 0);
            await setDoc(doc(db, ...userPath, 'data', 'gear'), { ...gearInfo, uses: Math.max(0, currentUses - gymsCount) }, { merge: true });

            const deletedD = new Date(dateKey.includes('-') ? dateKey : new Date().setDate(Number(dateKey)));
            const today = new Date();
            if (deletedD.getMonth() === today.getMonth() && deletedD.getFullYear() === today.getFullYear()) {
                const newDays = attendanceDays.filter(d => d !== deletedD.getDate());
                await setDoc(doc(db, ...userPath, 'data', 'attendance'), { days: newDays }, { merge: true });
            }
        } catch(e) { console.error(e); }
    };

    return (
        <div className="space-y-5 animate-in fade-in pb-10">
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest mb-6">
                    <History className="w-5 h-5 text-blue-600" /> Attendance History
                </h3>

                <div className="space-y-3">
                    {sortedDates.length > 0 ? (
                        sortedDates.map(dateKey => {
                            let displayDate = "";
                            if (dateKey.includes('-')) {
                                const [year, month, day] = dateKey.split('-');
                                displayDate = `${parseInt(month)}월 ${parseInt(day)}일`;
                            } else {
                                displayDate = `이번 달 ${dateKey}일`;
                            }

                            const gymName = attendanceHistory[dateKey];
                            const isEditing = editingDateKey === dateKey;

                            return (
                                <div key={dateKey} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-sm transition-all min-w-0">
                                    {isEditing ? (
                                        <div className="space-y-3 animate-in fade-in min-w-0">
                                            <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-2">
                                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">기록 수정하기</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm min-w-0">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0 mr-2">날짜</label>
                                                    <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="appearance-none bg-transparent outline-none text-sm font-bold text-gray-700 text-right w-full flex-1 min-w-0" />
                                                </div>
                                                <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm min-w-0">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest shrink-0 mr-2">암장명</label>
                                                    <input type="text" value={editGymName} onChange={e => setEditGymName(e.target.value)} placeholder="암장명 입력" className="appearance-none bg-transparent outline-none text-sm font-bold text-gray-700 text-right w-full flex-1 min-w-0" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2 justify-end mt-3">
                                                <button onClick={() => setEditingDateKey(null)} className="px-4 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-600 text-xs font-bold transition-colors w-1/3">취소</button>
                                                <button onClick={() => handleEditSave(dateKey)} disabled={saving} className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-sm w-2/3">{saving ? '저장중...' : '수정 완료'}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center min-w-0">
                                            <div className="flex items-center gap-3 min-w-0 pr-2">
                          <span className="text-xs font-bold text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm whitespace-nowrap shrink-0">
                            {displayDate}
                          </span>
                                                <span className="text-sm font-bold text-gray-800 truncate">{gymName}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button onClick={() => handleEditClick(dateKey, gymName)} className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-blue-600 shadow-sm transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                                                <button onClick={() => handleDelete(dateKey)} className="p-2 bg-white rounded-xl border border-gray-100 text-gray-400 hover:text-rose-500 shadow-sm transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">출석 기록이 없습니다</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

// --- [QuestHistoryView] ---
const QuestHistoryView = ({ quests, questHistory }) => {
    const completedCount = quests.filter(q => q.current === q.goal).length;
    const sortedDates = Object.keys(questHistory).sort((a, b) => b.localeCompare(a));

    const getQuestIcon = (name) => {
        if (name === 'Wind') return <Wind className="w-5 h-5" />;
        if (name === 'Activity') return <Activity className="w-5 h-5" />;
        return <Smile className="w-5 h-5" />;
    };

    return (
        <div className="space-y-5 animate-in fade-in pb-10">
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest">
                        <Flame className="w-5 h-5 text-orange-500" /> Current Quests
                    </h3>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
            {completedCount} / {quests.length} 완료
          </span>
                </div>

                <div className="space-y-3">
                    {quests.length > 0 ? (
                        quests.map(q => (
                            <div key={q.id} className={`flex justify-between items-center p-4 rounded-2xl border transition-all ${q.current === q.goal ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-100'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl text-white shadow-sm ${q.current === q.goal ? q.color : 'bg-gray-300'}`}>
                                        {q.current === q.goal ? <CheckCircle2 className="w-5 h-5" /> : getQuestIcon(q.icon)}
                                    </div>
                                    <div>
                                        <h4 className={`text-sm font-bold ${q.current === q.goal ? 'text-gray-900' : 'text-gray-600'}`}>{q.title}</h4>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5 tracking-widest">진행도: {q.current} / {q.goal}</p>
                                    </div>
                                </div>

                                <div className="flex gap-1">
                                    {Array.from({ length: q.goal }).map((_, i) => (
                                        <div key={i} className={`w-2.5 h-6 rounded-sm ${i < q.current ? (q.current === q.goal ? 'bg-orange-400' : 'bg-blue-400') : 'bg-gray-200'}`} />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">진행 중인 퀘스트가 없습니다</p>
                        </div>
                    )}
                </div>
            </section>

            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest mb-6">
                    <History className="w-5 h-5 text-orange-500" /> Completed History
                </h3>

                <div className="space-y-3">
                    {sortedDates.length > 0 ? (
                        sortedDates.map(dateKey => {
                            const [year, month, day] = dateKey.split('-');
                            const displayDate = `${parseInt(month)}월 ${parseInt(day)}일`;

                            return (
                                <div key={dateKey} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100 min-w-0">
                <span className="text-xs font-bold text-orange-600 bg-white px-3 py-1.5 rounded-lg border border-orange-100 shadow-sm whitespace-nowrap shrink-0">
                  {displayDate}
                </span>
                                    <span className="text-sm font-bold text-gray-800 text-right ml-4 truncate leading-snug">{questHistory[dateKey]}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">달성한 퀘스트가 없습니다</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

// --- [MoveView] ---
const MoveView = ({ moves }) => (
    <div className="space-y-4 pb-10 animate-in fade-in">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-gray-400 text-[10px] uppercase font-bold tracking-widest mb-2">Technique Progress</h3>
            <div className="w-full bg-gray-100 h-2.5 rounded-full mt-2 overflow-hidden shadow-inner">
                <div className="bg-blue-600 h-full w-[45%] rounded-full" />
            </div>
        </div>
        {moves.map(m => (
            <div key={m.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Footprints className="w-4 h-4" /></div>
                    <div><h5 className="text-sm font-bold text-gray-800">{m.title}</h5><p className="text-[10px] text-gray-500 font-medium mt-0.5">{m.desc}</p></div>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3].map(lv => (
                        <button key={lv} className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${m.level >= lv ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>Lv.{lv}</button>
                    ))}
                </div>
            </div>
        ))}
    </div>
);