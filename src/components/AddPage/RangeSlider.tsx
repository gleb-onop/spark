import { useRef, useCallback, useEffect, useState } from 'react';
import { formatTime } from '@/utils/time';

interface RangeSliderProps {
    duration: number; // in seconds
    timeStart: number; // in seconds
    timeEnd: number; // in seconds
    onChange: (start: number, end: number) => void;
    className?: string;
}

export const RangeSlider = ({
    duration,
    timeStart,
    timeEnd,
    onChange,
    className
}: RangeSliderProps) => {
    const sliderRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);

    const getXFromTime = (time: number) => (time / duration) * 100;
    const getTimeFromX = (x: number) => (x / 100) * duration;

    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!isDragging || !sliderRef.current || duration === 0) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = (offsetX / rect.width) * 100;
        const newTime = getTimeFromX(percentage);

        if (isDragging === 'start') {
            onChange(Math.min(newTime, timeEnd - 0.5), timeEnd);
        } else {
            onChange(timeStart, Math.max(newTime, timeStart + 0.5));
        }
    }, [isDragging, duration, timeStart, timeEnd, onChange]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(null);
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleMouseMove);
            window.addEventListener('touchend', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleMouseMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    if (duration === 0) return null;

    const startPos = getXFromTime(timeStart);
    const endPos = getXFromTime(timeEnd);

    return (
        <div className={`space-y-4 ${className}`}>
            <div
                ref={sliderRef}
                className="relative h-2 bg-white/10 rounded-full select-none"
            >
                {/* Highlighted Range */}
                <div
                    className="absolute h-full bg-brand shadow-[0_0_20px_rgba(255,107,53,0.6)] rounded-full"
                    style={{ left: `${startPos}%`, right: `${100 - endPos}%` }}
                />

                {/* Start Handle */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-7 w-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] cursor-grab active:cursor-grabbing z-20 -ml-1 group"
                    style={{ left: `${startPos}%` }}
                    onMouseDown={(e) => { e.stopPropagation(); setIsDragging('start'); }}
                    onTouchStart={(e) => { e.stopPropagation(); setIsDragging('start'); }}
                >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand text-white text-[11px] font-black px-2 py-0.5 rounded-lg shadow-[0_4_10_rgba(0,0,0,0.3)] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity whitespace-nowrap border border-white/20">
                        {formatTime(timeStart)}
                    </div>
                </div>

                {/* End Handle */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 h-7 w-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] cursor-grab active:cursor-grabbing z-20 -ml-1 group"
                    style={{ left: `${endPos}%` }}
                    onMouseDown={(e) => { e.stopPropagation(); setIsDragging('end'); }}
                    onTouchStart={(e) => { e.stopPropagation(); setIsDragging('end'); }}
                >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-brand text-white text-[11px] font-black px-2 py-0.5 rounded-lg shadow-[0_4_10_rgba(0,0,0,0.3)] opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity whitespace-nowrap border border-white/20">
                        {formatTime(timeEnd)}
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-black text-white px-1 pointer-events-none drop-shadow-lg tracking-tight uppercase">
                <div className="flex items-center gap-1.5 flex-1">
                    <span className="text-white/40">ОТ:</span>
                    <span className="bg-brand px-2 py-0.5 rounded-md text-[11px] shadow-sm">{formatTime(timeStart)}</span>
                </div>
                <div className="flex items-center gap-1.5 justify-end flex-1">
                    <span className="text-white/40">ДО:</span>
                    <span className="bg-brand px-2 py-0.5 rounded-md text-[11px] shadow-sm">{formatTime(timeEnd)}</span>
                </div>
            </div>
        </div>
    );
};
