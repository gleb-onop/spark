import { Link } from 'react-router-dom';
import { useTheme } from '../hooks/use-theme';
import { Switch } from './ui/switch';
import { Sun, Moon } from 'lucide-react';

const Header = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <header className="px-5 py-4 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
            <Link to="/" className="no-underline color-inherit">
                <h1 className="m-0 text-2xl font-extrabold text-accent tracking-tighter font-serif">
                    Spark
                </h1>
            </Link>
            <div className="flex items-center gap-3">
                {theme === 'light' ? (
                    <Sun className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <Moon className="h-4 w-4 text-muted-foreground" />
                )}
                <Switch
                    checked={theme === 'dark'}
                    onCheckedChange={toggleTheme}
                    className="data-[state=checked]:bg-accent"
                />
            </div>
        </header>
    );
};

export default Header;
