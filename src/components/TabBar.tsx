import { NavLink } from 'react-router-dom';
import { LayoutGrid, PlusSquare } from 'lucide-react';

const TabBar = () => {
    return (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[390px] h-20 bg-background/80 backdrop-blur-xl border-t border-border/50 flex justify-around items-center z-[100] pb-[safe-area-inset-bottom] px-6 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.2)]">
            <NavLink
                to="/playlists"
                className={({ isActive }) =>
                    `flex flex-col items-center gap-1.5 no-underline transition-all duration-300 ${isActive ? 'text-accent scale-110' : 'text-muted-foreground hover:text-foreground'}`
                }
            >
                <LayoutGrid className={`h-6 w-6 transition-transform duration-300`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-inherit">Плейлисты</span>
            </NavLink>

            <NavLink
                to="/add"
                className={({ isActive }) =>
                    `flex flex-col items-center gap-1.5 no-underline transition-all duration-300 ${isActive ? 'text-accent scale-110' : 'text-muted-foreground hover:text-foreground'}`
                }
            >
                <PlusSquare className={`h-6 w-6 transition-transform duration-300`} />
                <span className="text-[10px] font-black uppercase tracking-widest text-inherit">Добавить</span>
            </NavLink>
        </nav>
    );
};

export default TabBar;
