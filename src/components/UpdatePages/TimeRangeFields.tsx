import { useState, useEffect } from 'react';
import { Label } from '../ui/label';
import { MaskedTimeInput } from './MaskedTimeInput';
import { parseTime, formatTime } from '@/utils/time';

interface TimeRangeFieldsProps {
    timeStart: string;
    timeEnd: string;
    onChangeStart: (val: string) => void;
    onChangeEnd: (val: string) => void;
    duration?: number;
}

export const TimeRangeFields = ({
    timeStart,
    timeEnd,
    onChangeStart,
    onChangeEnd,
    duration = 0,
}: TimeRangeFieldsProps) => {
    // Local state for smooth typing
    const [localStart, setLocalStart] = useState(timeStart);
    const [localEnd, setLocalEnd] = useState(timeEnd);

    // Sync external changes (e.g. from slider) to local state,
    // but only if the user is not actively typing (handled via blur).
    useEffect(() => {
        setLocalStart(timeStart);
    }, [timeStart]);

    useEffect(() => {
        setLocalEnd(timeEnd);
    }, [timeEnd]);

    const handleStartBlur = () => {
        if (!localStart.trim()) {
            // Restore previous valid if empty
            setLocalStart(timeStart);
            return;
        }
        onChangeStart(localStart);
    };

    const handleEndBlur = () => {
        if (!localEnd.trim()) {
            // Restore previous valid if empty
            setLocalEnd(timeEnd);
            return;
        }

        // Clamp to duration if exceeded
        if (duration > 0) {
            const endSeconds = parseTime(localEnd);
            if (endSeconds > duration) {
                const maxTimeStr = formatTime(duration, true);
                setLocalEnd(maxTimeStr);
                onChangeEnd(maxTimeStr);
                return;
            }
        }

        onChangeEnd(localEnd);
    };

    return (
        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="space-y-2">
                <Label htmlFor="start" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Старт (ч:мм:сс.мс)</Label>
                <MaskedTimeInput
                    id="start"
                    value={localStart}
                    onChange={setLocalStart}
                    onBlur={handleStartBlur}
                    className="h-12"
                    duration={duration}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="end" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Конец (ч:мм:сс.мс)</Label>
                <MaskedTimeInput
                    id="end"
                    value={localEnd}
                    onChange={setLocalEnd}
                    onBlur={handleEndBlur}
                    className="h-12"
                    duration={duration}
                />
            </div>
        </div>
    );
};
