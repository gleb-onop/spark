import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import { cn } from '../lib/tailwind';

interface EmptyStateProps {
    icon: ReactNode;
    title: string;
    description: string;
    actionLabel?: string;
    actionTo?: string;
    className?: string;
}

export const EmptyState = ({
    icon,
    title,
    description,
    actionLabel,
    actionTo,
    className
}: EmptyStateProps) => {
    return (
        <div className={cn(
            "flex-1 flex flex-col items-center justify-center px-5 py-12 text-center animate-in fade-in zoom-in duration-500",
            className
        )}>
            <div className="p-6 bg-accent/10 rounded-full mb-6">
                {icon}
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2">{title}</h2>
            <p className="text-muted-foreground text-sm mb-10 max-w-[280px] leading-relaxed">
                {description}
            </p>
            {actionLabel && actionTo && (
                <Button asChild size="lg" className="w-full h-16 rounded-2xl shadow-xl shadow-brand/20 bg-brand hover:bg-brand/90 text-white font-bold text-lg">
                    <Link to={actionTo}>
                        {actionLabel}
                    </Link>
                </Button>
            )}
        </div>
    );
};
