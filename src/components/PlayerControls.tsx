import { useState, useEffect, useRef, type RefObject } from 'react';
import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize,
} from 'lucide-react';
import { PLAYBACK_RATES, type PlayerControlsState } from '@/hooks/usePlayerControls';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const CONTROLS_AUTO_HIDE_DELAY_MS = 3000;

interface PlayerControlsProps extends PlayerControlsState {
    containerRef: RefObject<HTMLElement>;
}

export const PlayerControls = ({
    containerRef,
    isPlaying,
    progressPct,
    currentTimeStr,
    durationStr,
    volume,
    isMuted,
    playbackRate,
    isFullscreen,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setRate,
    toggleFullscreen,
}: PlayerControlsProps) => {
    const [visible, setVisible] = useState(true);
    const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-hide controls in fullscreen mode
    useEffect(() => {
        if (!isFullscreen) {
            setVisible(true);
            return;
        }

        const scheduleHide = () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            setVisible(true);
            hideTimerRef.current = setTimeout(() => setVisible(false), CONTROLS_AUTO_HIDE_DELAY_MS);
        };

        scheduleHide(); // start timer immediately on entering fullscreen

        const container = containerRef.current;
        if (container) {
            container.addEventListener('mousemove', scheduleHide);
            container.addEventListener('touchstart', scheduleHide);
            container.addEventListener('click', scheduleHide);
        }

        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            if (container) {
                container.removeEventListener('mousemove', scheduleHide);
                container.removeEventListener('touchstart', scheduleHide);
                container.removeEventListener('click', scheduleHide);
            }
        };
    }, [isFullscreen, containerRef]);

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        seek(Math.max(0, Math.min(100, pct)));
    };

    const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const pct = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
        seek(Math.max(0, Math.min(100, pct)));
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setVolume(Number(e.target.value));
    };

    return (
        <>
            {/* Catch clicks over the video when controls are hidden in fullscreen */}
            {isFullscreen && (
                <div
                    className={cn(
                        "absolute inset-0 z-40",
                        visible ? "pointer-events-none" : "pointer-events-auto"
                    )}
                />
            )}
            <div
                className={cn(
                    'w-full transition-opacity duration-300',
                    isFullscreen
                        ? 'absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent px-4 py-3'
                        : 'bg-black/90 px-4 py-3',
                    isFullscreen && !visible ? 'opacity-0 pointer-events-none' : 'opacity-100',
                )}
            >
                {/* Progress Bar */}
                <div
                    className="relative w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group"
                    onClick={handleProgressClick}
                    onTouchStart={handleProgressTouch}
                >
                    {/* Buffered visual */}
                    <div
                        className="absolute left-0 top-0 h-full bg-white/30 rounded-full"
                        style={{ width: `${progressPct}%` }}
                    />
                    {/* Played */}
                    <div
                        className="absolute left-0 top-0 h-full bg-brand rounded-full transition-[width] duration-100"
                        style={{ width: `${progressPct}%` }}
                    />
                    {/* Thumb */}
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                        style={{ left: `calc(${progressPct}% - 6px)` }}
                    />
                </div>

                {/* Controls Row */}
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar touch-pan-x w-full">
                    {/* Play/Pause */}
                    <button
                        onClick={togglePlay}
                        className="text-white hover:text-brand transition-colors shrink-0"
                        aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
                    >
                        {isPlaying
                            ? <Pause className="h-5 w-5 fill-current" />
                            : <Play className="h-5 w-5 fill-current" />
                        }
                    </button>

                    {/* Time */}
                    <span className="text-white/70 text-xs font-mono shrink-0 tabular-nums">
                        {currentTimeStr} / {durationStr}
                    </span>

                    {/* Flex spacer */}
                    <div className="flex-1 min-w-[10px]" />

                    {/* Volume - hidden on very small screens since mobile has hardware buttons */}
                    <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                        <button
                            onClick={toggleMute}
                            className="text-white/80 hover:text-white transition-colors"
                            aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
                        >
                            {(isMuted || volume === 0)
                                ? <VolumeX className="h-4 w-4" />
                                : <Volume2 className="h-4 w-4" />
                            }
                        </button>
                        <input
                            type="range"
                            min={0}
                            max={100}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-16 h-1 accent-brand cursor-pointer"
                            aria-label="Громкость"
                        />
                    </div>

                    {/* Playback Rate */}
                    <div className="flex items-center gap-px shrink-0">
                        <DropdownMenu>
                            <DropdownMenuTrigger className="text-[11px] font-bold px-2 py-1 bg-brand text-white rounded transition-colors leading-none hover:bg-brand/90 outline-none">
                                {playbackRate === 1 ? '1×' : `${playbackRate}×`}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="end" className="min-w-[4rem]">
                                {PLAYBACK_RATES.map((rate) => (
                                    <DropdownMenuItem
                                        key={rate}
                                        onClick={() => setRate(rate)}
                                        className="justify-center font-medium text-xs cursor-pointer"
                                    >
                                        {rate === 1 ? '1×' : `${rate}×`}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Fullscreen */}
                    <button
                        onClick={toggleFullscreen}
                        className="text-white/80 hover:text-white transition-colors shrink-0"
                        aria-label={isFullscreen ? 'Выйти из полноэкранного режима' : 'Полноэкранный режим'}
                    >
                        {isFullscreen
                            ? <Minimize className="h-4 w-4" />
                            : <Maximize className="h-4 w-4" />
                        }
                    </button>
                </div>
            </div>
        </>
    );
};
