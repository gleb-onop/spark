import { NavLink } from 'react-router-dom';
import { LayoutGrid, PlusSquare } from 'lucide-react';

const navItems = [
    { to: '/segmented-videos', icon: LayoutGrid, label: 'Видео', end: true },
    { to: '/segmented-videos/new', icon: PlusSquare, label: 'Добавить' },
];

const TabBar = () => {
    return (
        <>
            {/* Mobile: fixed bottom bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 mx-auto w-full max-w-[390px] h-20 bg-background/80 backdrop-blur-xl border-t border-border/50 flex justify-around items-center z-[100] pb-[safe-area-inset-bottom] px-6 shadow-[0_-8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_-8px_30px_rgb(0,0,0,0.2)]">
                {navItems.map(({ to, icon: Icon, label, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `flex-1 flex flex-col items-center gap-1.5 no-underline transition-all duration-300 ${isActive ? 'text-accent scale-110' : 'text-muted-foreground hover:text-foreground'}`
                        }
                    >
                        <Icon className="h-6 w-6 transition-transform duration-300" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-inherit text-center leading-tight">{label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* Desktop: fixed left sidebar 240px */}
            <aside className="hidden md:flex mobile-landscape:flex fixed left-0 top-0 bottom-0 w-60 mobile-landscape:w-20 flex-col border-r border-border/50 bg-background/95 backdrop-blur-xl z-[100] py-6 px-4 mobile-landscape:px-2">
                <div className="text-2xl font-black text-brand font-serif mb-8 px-3 select-none tracking-tight mobile-landscape:hidden">
                    Spark ✦
                </div>
                <nav className="flex flex-col gap-1 mobile-landscape:gap-4 mobile-landscape:items-center">
                    {navItems.map(({ to, icon: Icon, label, end }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={end}
                            className={({ isActive }) =>
                                `flex items-center gap-3 no-underline transition-all duration-200 px-3 py-2.5 rounded-xl text-sm font-semibold mobile-landscape:p-2.5 ${isActive
                                    ? 'text-brand bg-brand/10'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`
                            }
                        >
                            <Icon className="h-5 w-5 shrink-0" />
                            <span className="mobile-landscape:hidden">{label}</span>
                        </NavLink>
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default TabBar;

