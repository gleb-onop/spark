import { NavLink } from 'react-router-dom';

const TabBar = () => {
    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-16 bg-inherit border-t border-gray-100 dark:border-white/10 flex justify-around items-center z-[100] pb-[safe-area-inset-bottom]">
            <NavLink
                to="/playlists"
                className={({ isActive }) =>
                    `flex flex-col items-center gap-1 no-underline text-xs font-medium transition-colors ${isActive ? 'text-accent' : 'text-inactive'}`
                }
            >
                <span className="text-2xl leading-none">⊞</span>
                <span>Плейлисты</span>
            </NavLink>
            <NavLink
                to="/add"
                className={({ isActive }) =>
                    `flex flex-col items-center gap-1 no-underline text-xs font-medium transition-colors ${isActive ? 'text-accent' : 'text-inactive'}`
                }
            >
                <span className="text-2xl leading-none">+</span>
                <span>Добавить</span>
            </NavLink>
        </nav>
    );
};

export default TabBar;
