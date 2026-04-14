const NavItem = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center w-full pt-1 gap-1 transition-all ${isActive ? 'text-blue-600 scale-110 font-bold' : 'text-gray-400 font-medium'}`}>
        <div className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(37,99,235,0.4)]' : ''}`}>{icon}</div>
        <span className="text-[9px] tracking-widest uppercase">{label}</span>
    </button>
);

export default NavItem;