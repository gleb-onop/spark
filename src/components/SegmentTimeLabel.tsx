import { Scissors } from 'lucide-react';
import { parseTime, formatTime } from '@/utils/time';

interface SegmentTimeLabelProps {
    timeStart: string;
    timeEnd?: string | null;
    variant?: 'full' | 'compact';
    showMs?: boolean;
}

export const SegmentTimeLabel = ({ timeStart, timeEnd, variant = 'full', showMs = false }: SegmentTimeLabelProps) => {
    const startText = formatTime(parseTime(timeStart), showMs);
    const endText = timeEnd ? formatTime(parseTime(timeEnd), showMs) : '';
    const label = `${startText}${endText ? ` – ${endText}` : ''}`;

    if (variant === 'compact') {
        return (
            <div className="text-[10px] text-brand font-bold mt-0.5">
                {label}
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 text-sm text-brand font-black bg-brand/10 w-fit px-3 py-1 rounded-xl border border-brand/20 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
            <Scissors data-testid="scissors-icon" className="h-4 w-4" />
            <span>{label}</span>
        </div>
    );
};
