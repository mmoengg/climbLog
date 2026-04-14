import {
    Menu,
    X,
    Award,
    Home,
    Wallet,
    Ticket,
    PenSquare,
    History as HistoryIcon,
    Flame,
    Trophy,
    LogOut,
} from 'lucide-react';
import NavItem from './NavItem';
import Header from "./Header.jsx";
import Sidebar from "./Sidebar.jsx";
import BottomNav from "./BottomNav.jsx";

export default function MainLayout({ user, isMenuOpen, setIsMenuOpen, activeTab, setActiveTab, handleSignOut, children }) {
    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-800 font-sans max-w-md mx-auto shadow-[0_0_40px_rgba(0,0,0,0.05)] relative overflow-hidden text-left">
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} handleSignOut={handleSignOut} />
            <Header user={user} activeTab={activeTab} setIsMenuOpen={setIsMenuOpen} />
            <main className="flex-1 overflow-y-auto p-4 pb-24 bg-[#F8FAFC]">
                {children}
            </main>
            <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
    );
}
