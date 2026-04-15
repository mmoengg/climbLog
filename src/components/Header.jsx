import {Home, Menu, PenSquare, Ticket, Wallet} from 'lucide-react';

const Header = ({ user, activeTab, setIsMenuOpen }) => {
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
        <header>
            <div className="flex items-center justify-between px-4 h-12 bg-primary-800 ">
                <h1 className="text-white font-extrabold text-xs uppercase">climblog</h1>
                <button onClick={() => setIsMenuOpen(true)}>
                    <Menu className="w-5 h-5 text-white" />
                </button>
            </div>
            <div className="flex items-center gap-1.5 px-4 h-12 border-b-border bg-white">
                {activeTab === 'home' && <Home className="w-4 h-4" />}
                {activeTab === 'expenses' && <Wallet className="w-4 h-4" />}
                {activeTab === 'passes' && <Ticket className="w-4 h-4" />}
                {activeTab === 'record' && <PenSquare className="w-4 h-4" />}

                <h2 className="text-sm text-text font-semibold tracking-tight">
                    {getHeaderTitle()}
                </h2>
            </div>
        </header>
    );
}

export default Header;