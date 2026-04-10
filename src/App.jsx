import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    signInWithCustomToken
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    collection,
    onSnapshot,
    addDoc,
    updateDoc
} from 'firebase/firestore';
import {
    Calendar, BookOpen, PenSquare, Home, Award, ChevronRight,
    CheckCircle2, MapPin, Search, Video, PlayCircle, Users,
    Activity, Ticket, Menu, X, Settings, LogOut, Edit3, Clock, Flame, Target, TrendingUp, Car, AlertCircle, Plus, MessageSquare, Sticker, Smile, Wind, History, Trophy, Footprints, Hand, ShieldCheck, Zap, ChevronDown, Loader2, Mail, Lock, Sparkles, BrainCircuit
} from 'lucide-react';

// --- [Gemini API Logic] ---
const apiKey= import.meta.env.VITE_GEMINI_API_KEY;

const callGemini = async (prompt) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: "당신은 20년 경력의 전문 클라이밍 코치입니다. 사용자의 질문에 친절하고 전문적으로 답변하며, 한국어로 간결하게 (3문장 이내) 답변하세요." }] }
    };

    const fetchWithRetry = async (retries = 5, delay = 1000) => {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            return result.candidates?.[0]?.content?.parts?.[0]?.text;
        } catch (err) {
            if (retries > 0) {
                await new Promise(res => setTimeout(res, delay));
                return fetchWithRetry(retries - 1, delay * 2);
            }
            throw err;
        }
    };

    return fetchWithRetry();
};

// --- [Firebase 설정] ---
// App.jsx 상단
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'climb-log-app';

// --- [공통 컴포넌트] ---

const MenuNavItem = ({ icon, label, onClick, isActive, color = "text-gray-700" }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 shadow-sm font-black' : `hover:bg-gray-50 ${color}`}`}>
        {icon} <span className="font-bold text-sm">{label}</span>
    </button>
);

const NavItem = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center w-full pt-1 gap-1 transition-all ${isActive ? 'text-blue-600 scale-110 font-black' : 'text-gray-300 font-black'}`}>
        <div className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]' : ''}`}>{icon}</div>
        <span className="text-[9px] font-black tracking-widest uppercase">{label}</span>
    </button>
);

// --- [인증 화면] ---
const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (isLogin) { await signInWithEmailAndPassword(auth, email, password); }
            else { await createUserWithEmailAndPassword(auth, email, password); }
        } catch (err) { setError('인증에 실패했습니다. 정보를 확인해 주세요.'); }
        finally { setLoading(false); }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-[#F8FAFC]">
            <div className="w-full max-w-sm space-y-8 animate-in fade-in duration-700 text-left">
                <div className="text-center">
                    <div className="inline-flex p-4 bg-blue-600 rounded-3xl shadow-xl text-white mb-4"><Award className="w-10 h-10" /></div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase">Climb Log ✨</h2>
                    <p className="text-gray-500 text-sm font-bold mt-2 font-black">AI 코칭과 함께하는 스마트한 등반 기록</p>
                </div>
                <form onSubmit={handleAuth} className="space-y-4">
                    <div className="relative"><Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" /><input type="email" placeholder="이메일" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
                    <div className="relative"><Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" /><input type="password" placeholder="비밀번호" className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-blue-500 font-bold" value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
                    {error && <p className="text-xs text-rose-500 font-black px-2">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl uppercase tracking-widest disabled:opacity-50">{loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}</button>
                </form>
                <div className="text-center font-black"><button onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold text-blue-600 underline underline-offset-4">{isLogin ? '계정 만들기' : '로그인하기'}</button></div>
            </div>
        </div>
    );
};

// --- [Main App] ---
export default function App() {
    const [activeTab, setActiveTab] = useState('home');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Firestore States
    const [attendanceDays, setAttendanceDays] = useState([]);
    const [shoeUses, setShoeUses] = useState(0);
    const [passes, setPasses] = useState([]);
    const [quests, setQuests] = useState([]);
    const [moves, setMoves] = useState([]);
    const [sessions, setSessions] = useState([]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!user) return;
        const userPath = ['artifacts', appId, 'users', user.uid];
        const unsubAttendance = onSnapshot(doc(db, ...userPath, 'data', 'attendance'), (docSnap) => setAttendanceDays(docSnap.data()?.days || []));
        const unsubPasses = onSnapshot(collection(db, ...userPath, 'passes'), (snapshot) => setPasses(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubQuests = onSnapshot(doc(db, ...userPath, 'data', 'quests'), (docSnap) => setQuests(docSnap.data()?.list || []));
        const unsubMoves = onSnapshot(doc(db, ...userPath, 'data', 'moves'), (docSnap) => setMoves(docSnap.data()?.list || []));
        const unsubSessions = onSnapshot(collection(db, ...userPath, 'sessions'), (snapshot) => setSessions(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubGear = onSnapshot(doc(db, ...userPath, 'data', 'gear'), (docSnap) => setShoeUses(docSnap.data()?.shoeUses || 0));

        return () => { unsubAttendance(); unsubPasses(); unsubQuests(); unsubMoves(); unsubSessions(); unsubGear(); };
    }, [user]);

    const handleAttendance = async (passId) => {
        const today = new Date().getDate();
        if (attendanceDays.includes(today)) return;
        const userPath = ['artifacts', appId, 'users', user.uid];
        await setDoc(doc(db, ...userPath, 'data', 'attendance'), { days: [...attendanceDays, today] });
        await setDoc(doc(db, ...userPath, 'data', 'gear'), { shoeUses: shoeUses + 1 });
        if (passId) {
            const target = passes.find(p => p.id === passId);
            if (target?.type === 'punch' && target.remaining > 0) { await updateDoc(doc(db, ...userPath, 'passes', passId), { remaining: target.remaining - 1 }); }
        }
    };

    const handleSignOut = () => { signOut(auth); setIsMenuOpen(false); };

    if (loading) return <div className="h-screen flex items-center justify-center bg-white font-black text-blue-600"><Loader2 className="animate-spin mr-2" /> Loading...</div>;
    if (!user) return <AuthScreen />;

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-800 font-sans max-w-md mx-auto border shadow-lg relative overflow-hidden text-left font-medium">
            {/* Sidebar Menu */}
            <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-black/50 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)} />
                <aside className={`absolute top-0 left-0 w-3/4 h-full bg-white shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="p-6">
                        <h2 className="text-xl font-black text-blue-600 border-b pb-4 mb-8 uppercase flex items-center gap-2"><Award /> Climb Log</h2>
                        <div className="mb-6 p-4 bg-gray-50 rounded-2xl border font-black"><p className="text-[10px] text-gray-400 uppercase">User Profile</p><p className="text-xs font-black truncate">{user.email}</p></div>
                        <nav className="space-y-1">
                            <MenuNavItem icon={<Trophy className="w-5 h-5" />} label="무브 컬렉션" onClick={() => { setActiveTab('moves'); setIsMenuOpen(false); }} isActive={activeTab === 'moves'} />
                            <MenuNavItem icon={<History className="w-5 h-5" />} label="퀘스트 히스토리" onClick={() => { setActiveTab('history'); setIsMenuOpen(false); }} isActive={activeTab === 'history'} />
                            <div className="h-[1px] bg-gray-100 my-4" />
                            <MenuNavItem icon={<LogOut className="w-5 h-5" />} label="로그아웃" color="text-red-500" onClick={handleSignOut} />
                        </nav>
                    </div>
                </aside>
            </div>

            {/* Header */}
            <header className="bg-white p-4 shadow-sm z-10 flex justify-between items-center border-b border-gray-100 font-black">
                <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl"><Menu className="w-6 h-6" /></button>
                <h1 className="text-lg font-black uppercase tracking-widest">{activeTab.toUpperCase()}</h1>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-inner uppercase">{user.email?.charAt(0)}</div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-24 bg-[#F8FAFC]">
                {activeTab === 'home' && <HomeView user={user} attendanceDays={attendanceDays} passes={passes} quests={quests} shoeUses={shoeUses} onAttendance={handleAttendance} />}
                {activeTab === 'record' && <RecordView user={user} passes={passes} sessions={sessions} />}
                {activeTab === 'moves' && <MoveView user={user} moves={moves} />}
                {activeTab === 'history' && <div className="p-10 text-center text-gray-400 font-black uppercase tracking-widest">History is syncing...</div>}
            </main>

            <nav className="bg-white border-t flex justify-around p-2 pb-5 fixed bottom-0 w-full max-w-md shadow-2xl">
                <NavItem icon={<Home />} label="HOME" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
                <NavItem icon={<PenSquare />} label="LOG" isActive={activeTab === 'record'} onClick={() => setActiveTab('record')} />
            </nav>
        </div>
    );
}

// --- [Home View: Dashboard with AI Quest] ---
const HomeView = ({ user, attendanceDays, passes, quests, shoeUses, onAttendance }) => {
    const [showGymList, setShowGymList] = useState(false);
    const [aiQuest, setAiQuest] = useState(null);
    const [isAiGenerating, setIsAiGenerating] = useState(false);

    const today = new Date().getDate();
    const isAttendedToday = attendanceDays.includes(today);
    const lifespan = Math.max(0, 100 - shoeUses);

    const handleGenerateQuest = async () => {
        setIsAiGenerating(true);
        try {
            const prompt = `현재 나의 신발 수명은 ${lifespan}%이고, 최근 출석 횟수는 ${attendanceDays.length}회입니다. 오늘 암장에서 즐겁게 할 수 있는 마이크로 퀘스트 하나를 추천해주세요. 20자 이내로요.`;
            const result = await callGemini(prompt);
            setAiQuest(result);
        } catch (err) { console.error(err); }
        finally { setIsAiGenerating(false); }
    };

    return (
        <div className="space-y-5 animate-in fade-in duration-700 font-black">
            <section className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 font-black">
                <div className="flex justify-between items-center mb-5 font-black font-black font-black"><h3 className="font-black flex items-center gap-2 uppercase tracking-widest"><Calendar className="w-5 h-5 text-blue-600" /> Attendance</h3><span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full">{attendanceDays.length}회</span></div>
                {!isAttendedToday ? (
                    <button onClick={() => setShowGymList(!showGymList)} className="w-full py-4 rounded-2xl font-black bg-blue-600 text-white shadow-xl uppercase tracking-widest">CHECK-IN 🐾</button>
                ) : (
                    <div className="bg-blue-50 border-blue-100 p-4 rounded-2xl flex items-center gap-3 font-black"><CheckCircle2 className="text-blue-600" /><p className="text-sm font-black text-blue-900">오늘도 등반 완료! 🧗‍♀️</p></div>
                )}
                {showGymList && !isAttendedToday && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-2xl space-y-2 animate-in slide-in-from-top-2 font-black">
                        {passes.map(p => (
                            <button key={p.id} onClick={() => onAttendance(p.id)} className="w-full bg-white p-3 rounded-xl border shadow-sm flex justify-between items-center font-black">
                                <div className="text-left font-black"><p className="text-sm font-black">{p.gym}</p><p className="text-[9px] text-gray-400 font-black uppercase"><Car className="w-3 h-3 inline mr-1" />{p.parking}</p></div>
                                <span className="text-[10px] font-black text-blue-600">{p.type === 'punch' ? `${p.remaining}회 남음` : '기간권'}</span>
                            </button>
                        ))}
                    </div>
                )}

                {/* AI Quest 추천 */}
                <div className="mt-6 p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100 relative overflow-hidden group">
                    <Sparkles className="absolute -right-2 -top-2 w-12 h-12 text-indigo-200 opacity-30 group-hover:scale-110 transition-transform" />
                    <h4 className="text-[11px] font-black text-indigo-600 uppercase mb-3 flex items-center gap-1.5"><BrainCircuit className="w-4 h-4" /> AI 스마트 퀘스트 ✨</h4>
                    <div className="min-h-[40px] flex items-center justify-center font-black">
                        {isAiGenerating ? <Loader2 className="w-5 h-5 animate-spin text-indigo-400" /> : <p className="text-xs font-black text-indigo-900 italic">"{aiQuest || '오늘은 어떤 등반을 해볼까요?'}"</p>}
                    </div>
                    <button onClick={handleGenerateQuest} className="mt-3 w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md">✨ 퀘스트 추천 받기</button>
                </div>
            </section>

            <section className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between font-black uppercase t-widest">
                <div className="flex items-center gap-4 font-black"><div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black border-2 ${lifespan < 30 ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>{lifespan}%</div><div><h4 className="font-black text-sm">Gear Status</h4><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Life: {shoeUses}/100 Climbs</p></div></div>
                <ChevronRight className="text-gray-300" />
            </section>
        </div>
    );
};

// --- [Log View: Session List with AI Analysis] ---
const RecordView = ({ user, passes, sessions }) => {
    const [viewMode, setViewMode] = useState('list');
    const [aiCoachResult, setAiCoachResult] = useState({});
    const [analyzingId, setAnalyzingId] = useState(null);

    const handleAiCoach = async (session) => {
        setAnalyzingId(session.id);
        try {
            const statsStr = Object.entries(session.stats || {}).map(([k,v]) => `${k}:${v}`).join(', ');
            const prompt = `나의 이번 클라이밍 기록을 분석해줘. 암장: ${session.gymName}, 완등기록: ${statsStr}, 요약: ${session.summary}. 다음 성장을 위한 맞춤 조언 3줄을 해줘.`;
            const result = await callGemini(prompt);
            setAiCoachResult(prev => ({ ...prev, [session.id]: result }));
        } catch (err) { console.error(err); }
        finally { setAnalyzingId(null); }
    };

    return (
        <div className="space-y-4 animate-in fade-in pb-10 text-left font-black">
            <div className="flex bg-gray-100 p-1 rounded-2xl mb-4 font-black">
                <button onClick={() => setViewMode('list')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>기록 리스트</button>
                <button onClick={() => setViewMode('stats')} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${viewMode === 'stats' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}>성장 분석 📈</button>
            </div>

            {viewMode === 'list' ? (
                <div className="space-y-4 font-black">
                    <div className="flex justify-between items-center px-1 uppercase font-black"><h2 className="text-xl font-black">My Sessions</h2><button className="bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase shadow-lg">+ New Log</button></div>
                    {sessions.map(s => (
                        <div key={s.id} className="bg-white p-5 rounded-3xl border border-gray-100 space-y-4 font-black font-black font-black">
                            <div className="flex justify-between items-start font-black">
                                <div><span className="text-[10px] text-gray-400 uppercase">{s.date}</span><h4 className="font-black text-sm uppercase">{s.gymName}</h4></div>
                                <button onClick={() => handleAiCoach(s)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 font-black"><Sparkles className={`w-4 h-4 ${analyzingId === s.id ? 'animate-spin' : ''}`} /></button>
                            </div>
                            <p className="text-[11px] text-blue-900 font-bold italic font-black font-black font-black">"{s.summary || '즐거운 등반이었습니다!'}"</p>

                            {aiCoachResult[s.id] && (
                                <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 animate-in zoom-in font-black">
                                    <p className="text-[10px] font-black text-indigo-700 uppercase mb-2 flex items-center gap-1"><BrainCircuit className="w-3 h-3" /> AI 세션 코칭 ✨</p>
                                    <p className="text-[10px] text-indigo-900 leading-relaxed font-bold font-black">{aiCoachResult[s.id]}</p>
                                </div>
                            )}
                            <div className="bg-emerald-50 p-3 rounded-2xl font-black"><p className="text-[10px] font-black text-emerald-700 flex items-center gap-1 uppercase font-black"><Target className="w-3 h-3" /> Next Project</p><p className="text-[10px] font-bold italic font-black">"{s.homework || '없음'}"</p></div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-10 text-center text-gray-400 font-black uppercase">Growth Stats is ready...</div>
            )}
        </div>
    );
};

// --- [Moves View with AI Training] ---
const MoveView = ({ user, moves }) => {
    const [trainingTip, setTrainingTip] = useState(null);
    const [loadingMove, setLoadingMove] = useState(null);

    const handleAskTraining = async (move) => {
        setLoadingMove(move.id);
        try {
            const prompt = `클라이밍 기술 중 '${move.title}'(${move.desc})을 마스터하고 싶습니다. 이를 위한 구체적인 연습 방법(트레이닝 드릴) 2가지만 알려주세요.`;
            const result = await callGemini(prompt);
            setTrainingTip(result);
        } catch (err) { console.error(err); }
        finally { setLoadingMove(null); }
    };

    return (
        <div className="space-y-4 pb-10 text-left font-black animate-in fade-in font-black">
            <div className="bg-white p-6 rounded-3xl border font-black"><h3 className="text-gray-400 text-[10px] uppercase font-black font-black mb-1 font-black font-black font-black">Move Mastery Progress</h3><div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden font-black"><div className="bg-blue-600 h-full w-[65%]" /></div></div>

            {trainingTip && (
                <div className="bg-indigo-600 text-white p-5 rounded-3xl shadow-xl shadow-indigo-100 relative font-black animate-in slide-in-from-top-4">
                    <button onClick={() => setTrainingTip(null)} className="absolute right-3 top-3"><X className="w-4 h-4" /></button>
                    <h4 className="text-[10px] font-black uppercase mb-2 flex items-center gap-1.5 font-black"><BrainCircuit className="w-4 h-4" /> AI 무브 트레이닝 가이드 ✨</h4>
                    <p className="text-xs leading-relaxed font-black font-black">{trainingTip}</p>
                </div>
            )}

            {moves.map(m => (
                <div key={m.id} className="bg-white p-5 rounded-3xl border border-gray-100 space-y-4 font-black font-black font-black">
                    <div className="flex items-center justify-between font-black">
                        <div className="flex items-center gap-3 font-black"><div className="p-2 bg-blue-50 text-blue-600 rounded-xl font-black font-black"><Footprints className="w-4 h-4 font-black" /></div><div><h5 className="text-sm font-black uppercase font-black font-black">{m.title}</h5><p className="text-[9px] text-gray-400 font-bold font-black">{m.desc}</p></div></div>
                        <button onClick={() => handleAskTraining(m)} className="text-indigo-600 p-2 font-black">{loadingMove === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}</button>
                    </div>
                    <div className="flex gap-1.5 font-black font-black">{[1, 2, 3].map(lv => (<button key={lv} className={`flex-1 py-2 rounded-xl text-[9px] font-black border ${m.level >= lv ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-100 text-gray-300'}`}>Lv.{lv}</button>))}</div>
                </div>
            ))}
        </div>
    );
};