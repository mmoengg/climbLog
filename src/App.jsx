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
    Activity, Ticket, Menu, X, Settings, LogOut, Edit3, Clock, Flame, Target, TrendingUp, Car, AlertCircle, Plus, MessageSquare, Sticker, Smile, Wind, History, Trophy, Footprints, Hand, ShieldCheck, Zap, ChevronDown, Loader2, Mail, Lock, Trash2
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

// --- [암장별 레벨 데이터] ---
const GYM_LEVELS = {
    "더클라임": ["하양", "노랑", "주황", "초록", "파랑", "빨강", "보라", "회색", "갈색", "검정"],
    "서울숲": ["하양", "노랑", "초록", "파랑", "빨강", "보라", "회색", "검정"],
    "피커스": ["하양", "노랑", "주황", "초록", "파랑", "빨강", "보라", "검정"],
    "클라이밍파크": ["하양", "노랑", "초록", "파랑", "빨강", "보라", "회색", "검정"],
    "기타": ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5", "Level 6", "Level 7"]
};

// 암장 이름에 포함된 단어를 바탕으로 레벨 시스템을 자동으로 찾아주는 함수
const getLevelsForGym = (gymName) => {
    if (!gymName) return GYM_LEVELS["기타"];
    if (gymName.includes("더클라임")) return GYM_LEVELS["더클라임"];
    if (gymName.includes("서울숲")) return GYM_LEVELS["서울숲"];
    if (gymName.includes("피커스")) return GYM_LEVELS["피커스"];
    if (gymName.includes("클라이밍파크") || gymName.includes("클파")) return GYM_LEVELS["클라이밍파크"];
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
    const [shoeUses, setShoeUses] = useState(0);
    const [passes, setPasses] = useState([]);
    const [quests, setQuests] = useState([]);
    const [moves, setMoves] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [parkingInfo, setParkingInfo] = useState({});
    const [attendanceHistory, setAttendanceHistory] = useState({});
    const [questHistory, setQuestHistory] = useState({}); // 퀘스트 히스토리 상태 추가

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
        const unsubPasses = onSnapshot(collection(db, ...userPath, 'passes'), (snapshot) => setPasses(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));

        const unsubQuests = onSnapshot(doc(db, ...userPath, 'data', 'quests'), (docSnap) => {
            if (docSnap.exists()) setQuests(docSnap.data()?.list || []);
            else setQuests([
                { id: 1, title: '오버행 벽 도전', goal: 3, current: 0, icon: 'Wind', color: 'bg-indigo-500' },
                { id: 2, title: '안전한 매트 착지', goal: 5, current: 0, icon: 'Activity', color: 'bg-emerald-500' },
                { id: 3, title: '옆 사람 나이스!', goal: 1, current: 0, icon: 'Smile', color: 'bg-amber-500' },
            ]);
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

        const unsubGear = onSnapshot(doc(db, ...userPath, 'data', 'gear'), (docSnap) => setShoeUses(docSnap.data()?.shoeUses || 0));

        const unsubParking = onSnapshot(doc(db, ...userPath, 'data', 'parking'), (docSnap) => {
            setParkingInfo(docSnap.data() || {});
        });

        const unsubHistory = onSnapshot(doc(db, ...userPath, 'data', 'attendanceHistory'), (docSnap) => {
            setAttendanceHistory(docSnap.data() || {});
        });

        // 퀘스트 히스토리 동기화 추가
        const unsubQuestHistory = onSnapshot(doc(db, ...userPath, 'data', 'questHistory'), (docSnap) => {
            setQuestHistory(docSnap.data() || {});
        });

        return () => { unsubAttendance(); unsubPasses(); unsubQuests(); unsubMoves(); unsubSessions(); unsubGear(); unsubParking(); unsubHistory(); unsubQuestHistory(); };
    }, [user]);

    const uniqueBrands = useMemo(() => {
        const baseBrands = ["더클라임", "서울숲", "피커스", "클라이밍파크", "알레"];
        const passBrands = passes.map(p => p.gym);
        return Array.from(new Set([...baseBrands, ...passBrands])).sort();
    }, [passes]);

    const uniqueGyms = useMemo(() => {
        const baseGyms = ["더클라임 신림", "더클라임 문래", "더클라임 홍대", "서울숲 구로", "피커스 종로"];
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
        <div className="flex flex-col h-screen bg-gray-50 text-gray-800 font-sans max-w-md mx-auto border shadow-lg relative overflow-hidden text-left">

            {/* Sidebar Menu */}
            <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-black/50 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)} />
                <aside className={`absolute top-0 left-0 w-3/4 h-full bg-white shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6 h-full flex flex-col">
                        <h2 className="text-xl font-black text-blue-600 border-b pb-4 mb-8 uppercase flex items-center gap-2"><Award /> Climb Log</h2>
                        <nav className="space-y-1 font-semibold flex-1 text-sm">
                            <button onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'home' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Home className="w-5 h-5" /> 대시보드</button>
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
                    {activeTab === 'home' ? 'Dashboard' : activeTab === 'record' ? 'Training' : activeTab === 'passes' ? 'Tickets' : activeTab === 'history' ? 'History' : activeTab === 'questHistory' ? 'Quests' : 'Moves'}
                </h1>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">{user.email?.charAt(0)}</div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-24 bg-[#F8FAFC]">
                {activeTab === 'home' && <HomeView user={user} attendanceDays={attendanceDays} passes={passes} shoeUses={shoeUses} quests={quests} parkingInfo={parkingInfo} uniqueGyms={uniqueGyms} attendanceHistory={attendanceHistory} questHistory={questHistory} />}
                {activeTab === 'record' && <RecordView user={user} sessions={sessions} uniqueGyms={uniqueGyms} />}
                {activeTab === 'passes' && <PassManagementView user={user} passes={passes} uniqueBrands={uniqueBrands} uniqueGyms={uniqueGyms} parkingInfo={parkingInfo} />}
                {activeTab === 'history' && <HistoryView attendanceHistory={attendanceHistory} />}
                {activeTab === 'questHistory' && <QuestHistoryView quests={quests} questHistory={questHistory} />}
                {activeTab === 'moves' && <MoveView moves={moves} />}
            </main>

            <nav className="bg-white border-t flex justify-around p-2 pb-5 fixed bottom-0 w-full max-w-md shadow-2xl">
                <NavItem icon={<Home />} label="HOME" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
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

// --- [HomeView] ---
// 수정: questHistory를 props로 정상적으로 받도록 추가했습니다.
const HomeView = ({ user, attendanceDays, passes, shoeUses, quests, parkingInfo, uniqueGyms, attendanceHistory, questHistory }) => {
    const today = new Date().getDate();
    const isAttendedToday = attendanceDays.includes(today);
    const lifespan = Math.max(0, 100 - shoeUses);

    const [showCheckInOptions, setShowCheckInOptions] = useState(false);
    const [customAttGym, setCustomAttGym] = useState('');

    const handleAttendance = async (passId, gymName = null) => {
        if (!user) return;
        const userPath = ['artifacts', appId, 'users', user.uid];

        const newDays = [...attendanceDays, today];
        await setDoc(doc(db, ...userPath, 'data', 'attendance'), { days: newDays }, { merge: true });
        await setDoc(doc(db, ...userPath, 'data', 'gear'), { shoeUses: shoeUses + 1 }, { merge: true });

        const finalGymName = (gymName && gymName.trim() !== '') ? gymName.trim() : '기본 출석';

        const now = new Date();
        const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const existingHistory = attendanceHistory[dateKey];
        const newHistoryEntry = existingHistory ? `${existingHistory}, ${finalGymName}` : finalGymName;
        await setDoc(doc(db, ...userPath, 'data', 'attendanceHistory'), { [dateKey]: newHistoryEntry }, { merge: true });

        if (passId) {
            const pass = passes.find(p => p.id === passId);
            if (pass && pass.type === 'punch' && pass.remaining > 0) {
                await updateDoc(doc(db, ...userPath, 'passes', passId), { remaining: pass.remaining - 1 });
            }
        }
        setShowCheckInOptions(false);
        setCustomAttGym('');
    };

    const handleQuestClick = async (qId) => {
        if (!user) return;
        const userPath = ['artifacts', appId, 'users', user.uid];

        const quest = quests.find(q => q.id === qId);
        if (!quest) return;

        const newCurrent = Math.min(quest.goal, quest.current + 1);
        const newQuests = quests.map(q => q.id === qId ? { ...q, current: newCurrent } : q);
        await setDoc(doc(db, ...userPath, 'data', 'quests'), { list: newQuests }, { merge: true });

        // 퀘스트 완료 시 날짜와 함께 히스토리에 기록 (이제 questHistory 데이터를 정상적으로 읽을 수 있습니다)
        if (quest.current < quest.goal && newCurrent === quest.goal) {
            const now = new Date();
            const dateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

            const existingHistory = questHistory[dateKey];
            const newHistoryEntry = existingHistory ? `${existingHistory}, ${quest.title}` : quest.title;

            await setDoc(doc(db, ...userPath, 'data', 'questHistory'), { [dateKey]: newHistoryEntry }, { merge: true });
        }
    };

    const getQuestIcon = (name) => {
        if (name === 'Wind') return <Wind className="w-5 h-5" />;
        if (name === 'Activity') return <Activity className="w-5 h-5" />;
        return <Smile className="w-5 h-5" />;
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-700">
            {/* 1. 캘린더 및 직관적인 출석 버튼 */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-5">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2 uppercase tracking-widest text-sm"><Calendar className="w-5 h-5 text-blue-600" /> Attendance</h3>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{attendanceDays.length}회 출석</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] mb-6 font-bold text-gray-400">
                    {['S','M','T','W','T','F','S'].map(d => <div key={d}>{d}</div>)}
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <div key={day} className={`aspect-square flex items-center justify-center rounded-2xl text-xs transition-all ${attendanceDays.includes(day) ? 'bg-blue-600 text-white font-bold shadow-md' : day === today ? 'border-2 border-blue-600 text-blue-600 font-bold' : 'text-gray-300'}`}>{day}</div>
                    ))}
                </div>

                <div className="mt-4">
                    {!showCheckInOptions ? (
                        <button onClick={() => setShowCheckInOptions(true)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold tracking-widest shadow-xl hover:bg-blue-700 transition-all uppercase flex items-center justify-center gap-2">
                            {isAttendedToday ? '한 번 더 출석하기 🐾' : '출석 체크하기 🐾'}
                        </button>
                    ) : (
                        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">출석 방법 선택</span>
                                <button onClick={() => setShowCheckInOptions(false)} className="text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full shadow-sm"><X className="w-4 h-4" /></button>
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
                                        className="w-full bg-gray-50 p-3 rounded-lg border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-700"
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

            {/* 3. 이용권 지갑 */}
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
                {passes.map(p => (
                    <div key={p.id} className={`min-w-[270px] p-5 rounded-3xl border transition-all relative overflow-hidden ${p.type === 'period' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                        <Ticket className={`absolute -right-4 -bottom-4 w-24 h-24 ${p.type === 'period' ? 'opacity-10 text-white' : 'opacity-5 text-gray-900'}`} />
                        <div className="flex justify-between items-start mb-4">
                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${p.type === 'period' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>{p.name}</span>
                            <div className={`text-xs font-black ${p.type === 'period' ? 'text-blue-100' : 'text-blue-600'}`}>D-{p.dDay}</div>
                        </div>
                        <h4 className="font-bold text-lg uppercase mb-2 tracking-tight">{p.gym}</h4>
                        <p className={`text-[10px] font-semibold tracking-wide ${p.type === 'period' ? 'text-blue-200' : 'text-gray-400'}`}>브랜드 전용 이용권</p>

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
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">등록된 브랜드 이용권이 없습니다</p>
                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium">하단 'TICKETS' 탭에서 브랜드 이용권을 등록해주세요.</p>
                    </div>
                )}
            </div>

            {/* 4. 지점별 개별 주차장 리스트 */}
            {Object.keys(parkingInfo).length > 0 && (
                <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest mb-4">
                        <Car className="w-5 h-5 text-blue-500" /> Branch Parking Info
                    </h3>
                    <div className="space-y-2">
                        {Object.entries(parkingInfo).map(([gymName, info]) => (
                            <div key={gymName} className="flex justify-between items-center bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-800">{gymName}</span>
                                <span className="text-[10px] font-semibold text-gray-500 bg-white px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm">{info}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 5. 신발 수명 */}
            <section className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg border-2 ${lifespan < 30 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>{lifespan}%</div>
                    <div><h4 className="font-bold text-sm uppercase text-gray-800">Gear Life</h4><p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">Shoe: {shoeUses}/100 Climbs</p></div>
                </div>
                <ChevronRight className="text-gray-300 w-5 h-5" />
            </section>
        </div>
    );
};

// --- [HistoryView: 출석 기록 리스트 렌더링] ---
const HistoryView = ({ attendanceHistory }) => {
    const sortedDates = Object.keys(attendanceHistory).sort((a, b) => {
        if (a.includes('-') && b.includes('-')) return b.localeCompare(a);
        return String(b).localeCompare(String(a));
    });

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

                            return (
                                <div key={dateKey} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-blue-600 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm whitespace-nowrap">
                  {displayDate}
                </span>
                                    <span className="text-sm font-bold text-gray-800 text-right ml-4 break-keep">{attendanceHistory[dateKey]}</span>
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

// --- [QuestHistoryView: 퀘스트 진행 상황 및 날짜별 달성 이력 렌더링] ---
const QuestHistoryView = ({ quests, questHistory }) => {
    const completedCount = quests.filter(q => q.current === q.goal).length;

    // 날짜(key)를 최신순(내림차순)으로 정렬합니다.
    const sortedDates = Object.keys(questHistory).sort((a, b) => b.localeCompare(a));

    const getQuestIcon = (name) => {
        if (name === 'Wind') return <Wind className="w-5 h-5" />;
        if (name === 'Activity') return <Activity className="w-5 h-5" />;
        return <Smile className="w-5 h-5" />;
    };

    return (
        <div className="space-y-5 animate-in fade-in pb-10">
            {/* 1. 현재 퀘스트 진행 현황 (상단) */}
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

            {/* 2. [추가됨] 날짜별 퀘스트 달성 히스토리 (하단) */}
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
                                <div key={dateKey} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <span className="text-xs font-bold text-orange-600 bg-white px-3 py-1.5 rounded-lg border border-orange-100 shadow-sm whitespace-nowrap">
                  {displayDate}
                </span>
                                    <span className="text-sm font-bold text-gray-800 text-right ml-4 break-keep leading-snug">{questHistory[dateKey]}</span>
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

// --- [RecordView: 훈련 기록용 (지점 단위)] ---
const RecordView = ({ user, sessions, uniqueGyms }) => {
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedGym, setSelectedGym] = useState(uniqueGyms[0] || '');
    const [customGym, setCustomGym] = useState('');
    const [newLevel, setNewLevel] = useState('');
    const [newSummary, setNewSummary] = useState('');
    const [saving, setSaving] = useState(false);

    // SVG 성장 차트 데이터 계산
    const chartData = useMemo(() => {
        const sorted = [...sessions].reverse().slice(-7); // 최근 7개
        if (sorted.length < 2) return null;

        const levels = GYM_LEVELS["더클라임"]; // 기준 레벨
        return sorted.map((s, i) => {
            const levelIdx = levels.indexOf(s.topLevel);
            return { x: i * 50 + 20, y: 150 - (levelIdx === -1 ? 0 : levelIdx * 15), val: s.topLevel };
        });
    }, [sessions]);

    const finalGymName = selectedGym === 'manual' ? customGym.trim() : selectedGym;
    const currentGymLevels = getLevelsForGym(finalGymName);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!user || !newLevel || !finalGymName) return;
        setSaving(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'sessions'), {
                gymName: finalGymName,
                topLevel: newLevel,
                summary: newSummary,
                date: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
                createdAt: serverTimestamp()
            });
            setShowAddForm(false);
            setNewSummary('');
            setCustomGym('');
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-10">
            {/* 성장 분석 차트 */}
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2 uppercase tracking-widest mb-4"><TrendingUp className="w-5 h-5 text-blue-600" /> Growth Analysis</h3>
                <div className="w-full bg-gray-50 rounded-2xl p-4 overflow-x-auto scrollbar-hide border border-gray-100/50">
                    {chartData ? (
                        <svg width="320" height="180" className="mx-auto">
                            {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1="0" y1={150 - i*30} x2="320" y2={150 - i*30} stroke="#E2E8F0" strokeWidth="1" strokeDasharray="4 4" />)}
                            <path d={`M ${chartData[0].x} 150 ${chartData.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${chartData[chartData.length-1].x} 150 Z`} fill="rgba(37, 99, 235, 0.1)" />
                            <path d={`M ${chartData[0].x} ${chartData[0].y} ${chartData.map(p => `L ${p.x} ${p.y}`).join(' ')}`} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {chartData.map((p, i) => (
                                <g key={i}>
                                    <circle cx={p.x} cy={p.y} r="5" fill="#2563EB" stroke="white" strokeWidth="2" />
                                    <text x={p.x} y={p.y - 12} textAnchor="middle" className="text-[10px] fill-blue-700 font-bold">{p.val}</text>
                                </g>
                            ))}
                        </svg>
                    ) : <p className="text-center py-10 text-gray-400 text-xs font-medium">최소 2회 이상의 세션 기록이 필요합니다.</p>}
                </div>
            </section>

            {/* 인라인 기록 추가 (방문 지점 단위) */}
            <section className="bg-white p-5 rounded-3xl border-2 border-dashed border-blue-200 transition-all hover:bg-blue-50/50">
                <button onClick={() => setShowAddForm(!showAddForm)} className="w-full flex items-center justify-between font-bold text-blue-600 uppercase tracking-widest text-sm">
                    <span className="flex items-center gap-2"><Plus className="w-5 h-5" /> Add New Training</span>
                    <ChevronDown className={`transition-transform duration-300 ${showAddForm ? 'rotate-180' : ''}`} />
                </button>
                {showAddForm && (
                    <form onSubmit={handleSave} className="mt-5 space-y-4 animate-in slide-in-from-top-4">
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-gray-500 ml-1">방문한 지점 선택</label>
                            <select value={selectedGym} onChange={e => setSelectedGym(e.target.value)} className="w-full bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-700 shadow-sm">
                                {uniqueGyms.map(g => <option key={g} value={g}>{g}</option>)}
                                <option value="manual">직접 입력 (+)</option>
                            </select>
                            {selectedGym === 'manual' && (
                                <input placeholder="새로운 방문 지점명 입력 (예: 더클라임 연남)" className="w-full bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-700 shadow-sm" value={customGym} onChange={e => setCustomGym(e.target.value)} required />
                            )}
                            <select value={newLevel} onChange={e => setNewLevel(e.target.value)} className="w-full bg-white p-3.5 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-700 shadow-sm" required>
                                <option value="">오늘의 최고 레벨 선택</option>
                                {currentGymLevels.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                            </select>
                        </div>
                        <textarea placeholder="오늘의 피드백 (예: 힐훅이 터져서 아쉬움)" className="w-full bg-white p-4 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium h-24 shadow-sm" value={newSummary} onChange={e => setNewSummary(e.target.value)} />
                        <button disabled={saving} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold tracking-widest uppercase shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50">
                            {saving ? '저장 중...' : 'SAVE LOG 🧗'}
                        </button>
                    </form>
                )}
            </section>

            {/* 기록 리스트 */}
            <div className="space-y-4">
                {sessions.map(s => (
                    <div key={s.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{s.date}</span>
                                <h4 className="font-bold text-gray-800 text-sm uppercase mt-0.5">{s.gymName} <span className="text-blue-600 ml-1">• {s.topLevel}</span></h4>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 font-medium leading-relaxed">"{s.summary}"</p>
                    </div>
                ))}
                {sessions.length === 0 && (
                    <div className="w-full p-8 bg-gray-50 rounded-3xl border border-gray-100 text-center shadow-inner">
                        <PenSquare className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">기록된 세션이 없습니다</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- [PassManagementView: 이용권(브랜드) + 주차(지점) 완전 분리 관리] ---
const PassManagementView = ({ user, passes, uniqueBrands, uniqueGyms, parkingInfo }) => {
    // 1. 이용권 폼 상태
    const [selectedBrand, setSelectedBrand] = useState(uniqueBrands[0] || '');
    const [customBrand, setCustomBrand] = useState('');
    const [name, setName] = useState('10회권');
    const [total, setTotal] = useState(10);
    const [type, setType] = useState('punch');
    const [savingPass, setSavingPass] = useState(false);

    // 2. 주차 정보 폼 상태
    const [selectedParkGym, setSelectedParkGym] = useState(uniqueGyms[0] || '');
    const [customParkGym, setCustomParkGym] = useState('');
    const [parkingMemo, setParkingMemo] = useState('');
    const [savingPark, setSavingPark] = useState(false);

    const handleAddPass = async (e) => {
        e.preventDefault();
        const finalBrandName = selectedBrand === 'manual' ? customBrand.trim() : selectedBrand;
        if (!user || !finalBrandName) return;
        setSavingPass(true);
        try {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'passes'), {
                gym: finalBrandName, // 브랜드명으로 사용
                name,
                total: Number(total),
                remaining: type === 'punch' ? Number(total) : 0,
                type,
                dDay: 30,
                end: '2026-12-31'
            });
            setCustomBrand(''); setName(''); setSelectedBrand(uniqueBrands[0]);
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

            {/* 섹션 1: 이용권(브랜드 단위) 등록 폼 */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-blue-600" /> 1. 브랜드 이용권 등록
                </h3>
                <form onSubmit={handleAddPass} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">브랜드 선택 (공통 사용)</label>
                        <select value={selectedBrand} onChange={e => setSelectedBrand(e.target.value)} className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800">
                            {uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}
                            <option value="manual">직접 입력 (+)</option>
                        </select>
                    </div>
                    {selectedBrand === 'manual' && (
                        <input placeholder="새로운 브랜드명 입력 (예: 알레)" className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800 animate-in slide-in-from-top-2" value={customBrand} onChange={e => setCustomBrand(e.target.value)} required />
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <input placeholder="이용권 이름 (예: 10회권)" className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800" value={name} onChange={e => setName(e.target.value)} required />
                        <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800">
                            <option value="punch">횟수권</option>
                            <option value="period">기간권</option>
                        </select>
                    </div>

                    {type === 'punch' && (
                        <div className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                            <label className="text-xs text-gray-500 font-bold uppercase tracking-widest">전체 횟수</label>
                            <input type="number" className="bg-white p-2 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold w-20 text-center ml-auto shadow-sm" value={total} onChange={e => setTotal(e.target.value)} min="1" />
                        </div>
                    )}
                    <button disabled={savingPass} className="w-full py-4 mt-2 bg-gray-900 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl hover:bg-gray-800 transition-colors disabled:opacity-50">
                        {savingPass ? '등록 중...' : 'REGISTER TICKET 💳'}
                    </button>
                </form>

                {/* 등록된 이용권 리스트 */}
                <div className="mt-6 space-y-2">
                    <h3 className="text-[10px] text-gray-400 uppercase font-bold px-2 tracking-widest mb-3">Active Brand Tickets</h3>
                    {passes.map(p => (
                        <div key={p.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">{p.gym}</h4>
                                <p className="text-[11px] text-gray-500 font-medium mt-0.5">{p.name} · {p.type === 'punch' ? `${p.remaining}회 남음` : '기간권'}</p>
                            </div>
                            <button onClick={() => handleDeletePass(p.id)} className="text-gray-400 hover:text-rose-500 hover:bg-white p-2 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {passes.length === 0 && <p className="text-center text-xs text-gray-400 py-4 border border-dashed border-gray-200 rounded-xl">등록된 이용권이 없습니다.</p>}
                </div>
            </section>

            {/* 섹션 2: 주차 정보(지점 단위) 개별 등록 폼 */}
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" /> 2. 지점별 주차장 등록
                </h3>
                <form onSubmit={handleSaveParking} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">방문하는 지점 선택</label>
                        <select value={selectedParkGym} onChange={e => setSelectedParkGym(e.target.value)} className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800">
                            {uniqueGyms.map(g => <option key={g} value={g}>{g}</option>)}
                            <option value="manual">직접 입력 (+)</option>
                        </select>
                    </div>
                    {selectedParkGym === 'manual' && (
                        <input placeholder="새로운 지점명 입력 (예: 더클라임 신림)" className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800 animate-in slide-in-from-top-2" value={customParkGym} onChange={e => setCustomParkGym(e.target.value)} required />
                    )}

                    <input placeholder="해당 지점의 주차 조건 (예: 건물 지하 불가)" className="w-full bg-gray-50 p-3.5 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-gray-800" value={parkingMemo} onChange={e => setParkingMemo(e.target.value)} required />

                    <button disabled={savingPark} className="w-full py-4 mt-2 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-colors disabled:opacity-50">
                        {savingPark ? '저장 중...' : 'SAVE PARKING INFO 🚗'}
                    </button>
                </form>

                {/* 등록된 주차 정보 리스트 */}
                <div className="mt-6 space-y-2">
                    <h3 className="text-[10px] text-gray-400 uppercase font-bold px-2 tracking-widest mb-3">Saved Parking Infos</h3>
                    {Object.entries(parkingInfo).map(([gymName, info]) => (
                        <div key={gymName} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-bold text-gray-800">{gymName}</h4>
                                <p className="text-[11px] text-blue-600 font-bold mt-0.5">{info}</p>
                            </div>
                            <button onClick={() => handleDeleteParking(gymName)} className="text-gray-400 hover:text-rose-500 hover:bg-white p-2 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    ))}
                    {Object.keys(parkingInfo).length === 0 && <p className="text-center text-xs text-gray-400 py-4 border border-dashed border-gray-200 rounded-xl">저장된 주차 정보가 없습니다.</p>}
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