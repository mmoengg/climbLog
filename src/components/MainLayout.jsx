import { Menu, X, Award, Home, Wallet, Ticket, PenSquare, History as HistoryIcon, Flame, Trophy, LogOut } from 'lucide-react';
import NavItem from './NavItem';

export default function MainLayout({ user, isMenuOpen, setIsMenuOpen, activeTab, setActiveTab, handleSignOut, children }) {
    const getHeaderTitle = () => {
        if (activeTab === 'home') return 'Dashboard';
        if (activeTab === 'record') return 'Training';
        if (activeTab === 'passes') return 'Tickets';
        if (activeTab === 'history') return 'History';
        if (activeTab === 'questHistory') return 'Quests';
        if (activeTab === 'expenses') return 'Wallet';
        return 'Moves';
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-800 font-sans max-w-md mx-auto shadow-[0_0_40px_rgba(0,0,0,0.05)] relative overflow-hidden text-left">

            <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
                <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
                    <div className={`absolute inset-0 bg-black/50 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)} />
                    <aside className={`absolute top-0 left-0 w-3/4 h-full bg-white shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <div className="p-6 h-full flex flex-col">
                            <h2 className="text-xl font-black text-blue-600 border-b pb-4 mb-8 uppercase flex items-center gap-2"><Award /> Climb Log</h2>
                            <nav className="space-y-1 font-semibold flex-1 text-sm">
                                <button onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'home' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Home className="w-5 h-5" /> 대시보드</button>
                                <button onClick={() => { setActiveTab('expenses'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'expenses' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Wallet className="w-5 h-5" /> 클라이밍 가계부</button>
                                <button onClick={() => { setActiveTab('passes'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'passes' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Ticket className="w-5 h-5" /> 이용권 & 주차 관리</button><button onClick={() => { setActiveTab('history'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'history' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><HistoryIcon className="w-5 h-5" /> 출석 기록</button>
                                <button onClick={() => { setActiveTab('questHistory'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'questHistory' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Flame className="w-5 h-5" /> 퀘스트 기록</button><button onClick={() => { setActiveTab('moves'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'moves' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Trophy className="w-5 h-5" /> 무브 컬렉션</button>
                                <div className="h-[1px] bg-gray-100 my-4" />
                                <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-3 rounded-xl text-rose-500 hover:bg-rose-50"><LogOut className="w-5 h-5" /> 로그아웃</button>
                            </nav>
                        </div>
                    </aside>
                </div>
            </div>

            <header className="bg-white p-4 shadow-sm z-10 flex justify-between items-center border-b border-gray-100">
                <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><Menu className="w-6 h-6 text-gray-600" /></button>
                <h1 className="text-lg font-bold uppercase tracking-widest text-gray-800">
                    {getHeaderTitle()}
                </h1>
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs uppercase shadow-inner">{user?.email?.charAt(0)}</div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-24 bg-[#F8FAFC]">
                {children}
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
