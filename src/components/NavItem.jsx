const NavItem = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-12 pt-1 gap-1 ${isActive ? 'text-primary font-bold' : 'text-gray-400 font-medium'}`}>
        <div>{icon}</div>
        <span className="text-[9px] uppercase">{label}</span>
    </button>
);

export default NavItem;