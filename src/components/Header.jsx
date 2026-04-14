import {Home, Menu} from 'lucide-react';

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
                <h1 className="text-white font-bold font">climblog</h1>
                <button onClick={() => setIsMenuOpen(true)}>
                    <Menu className="w-5 h-5 text-white" />
                </button>
            </div>
            <div className="flex items-center gap-1.5 px-4 h-12 border-b-border bg-white">
                <Home className="w-5 h-5" />
                <h2 className="text-sm text-text font-semibold">
                    {getHeaderTitle()}
                </h2>
            </div>

        </header>
    );
}

export default Header;