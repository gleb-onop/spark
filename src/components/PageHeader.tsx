import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { useTheme } from '../hooks/use-theme';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
    title: string;
    backPath?: string | -1;
    actions?: React.ReactNode;
    className?: string;
    sticky?: boolean;
}

export const PageHeader = ({
    title,
    backPath,
    actions,
    className,
    sticky = true
}: PageHeaderProps) => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useTheme();

    return (
        <header className={cn(
            "px-5 py-4 flex items-center justify-between z-10 border-b border-border bg-background/80 backdrop-blur-md md:hidden",
            sticky && "sticky top-0",
            className
        )}>
            <div className="flex items-center gap-2 min-w-0 max-w-[70%] md:max-w-none">
                {backPath !== undefined && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => typeof backPath === 'number' ? navigate(backPath) : navigate(backPath)}
                        className="rounded-full shrink-0"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                )}
                <h2 className="m-0 text-xl font-bold truncate">{title}</h2>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {actions}
                <div className="flex items-center gap-2 pl-2 border-l border-border/50">
                    <Switch
                        checked={theme === 'dark'}
                        onCheckedChange={toggleTheme}
                        className="h-5 w-9 data-[state=checked]:bg-accent"
                    />
                    {theme === 'light' ? (
                        <Sun className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <Moon className="h-4 w-4 text-muted-foreground" />
                    )}
                </div>
            </div>
        </header>
    );
};
