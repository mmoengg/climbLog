import { Home, Wallet, Ticket, PenSquare } from 'lucide-react';
import NavItem from './NavItem';

const BottomNav = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="fixed bottom-0 w-full max-w-md bg-white flex justify-around px-4 py-2 border-t-border">
            <NavItem icon={<Home className="w-5 h-5" />} label="HOME" isActive={activeTab === 'home'} onClick={() => setActiveTab('home')} />
            <NavItem icon={<Wallet className="w-5 h-5" />} label="WALLET" isActive={activeTab === 'expenses'} onClick={() => setActiveTab('expenses')} />
            <NavItem icon={<Ticket className="w-5 h-5" />} label="TICKETS" isActive={activeTab === 'passes'} onClick={() => setActiveTab('passes')} />
            <NavItem icon={<PenSquare className="w-5 h-5" />} label="TRAINING" isActive={activeTab === 'record'} onClick={() => setActiveTab('record')} />
        </nav>
    );
}

export default BottomNav;