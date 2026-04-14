import React from 'react';
import { Award, Home, Wallet, Ticket, PenSquare, History as HistoryIcon, Flame, Trophy, LogOut } from 'lucide-react';

export default function Sidebar({ isMenuOpen, setIsMenuOpen, activeTab, setActiveTab, handleSignOut }) {
    const navigateTo = (tab) => {
        setActiveTab(tab);
        setIsMenuOpen(false);
    };

    return (
        <div className={`fixed inset-0 z-50 transition-all duration-300 ${isMenuOpen ? 'visible' : 'invisible'}`}>
            <div className={`absolute inset-0 bg-black/50 transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMenuOpen(false)} />
            <aside className={`absolute top-0 left-0 w-3/4 h-full bg-white shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 h-full flex flex-col">
                    <h2 className="text-xl font-black text-blue-600 border-b pb-4 mb-8 uppercase flex items-center gap-2"><Award /> Climb Log</h2>
                    <nav className="space-y-1 font-semibold flex-1 text-sm">
                        <button onClick={() => navigateTo('home')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'home' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Home className="w-5 h-5" /> 대시보드</button>
                        <button onClick={() => navigateTo('expenses')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'expenses' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Wallet className="w-5 h-5" /> 클라이밍 가계부</button>
                        <button onClick={() => navigateTo('passes')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'passes' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Ticket className="w-5 h-5" /> 이용권 & 주차 관리</button>
                        <button onClick={() => navigateTo('history')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'history' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><HistoryIcon className="w-5 h-5" /> 출석 기록</button>
                        <button onClick={() => navigateTo('questHistory')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'questHistory' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Flame className="w-5 h-5" /> 퀘스트 기록</button>
                        <button onClick={() => navigateTo('moves')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'moves' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-600'}`}><Trophy className="w-5 h-5" /> 무브 컬렉션</button>
                        <div className="h-[1px] bg-gray-100 my-4" />
                        <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-3 rounded-xl text-rose-500 hover:bg-rose-50"><LogOut className="w-5 h-5" /> 로그아웃</button>
                    </nav>
                </div>
            </aside>
        </div>
    );
}
