import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Square } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { ensureYouTubeIframeAPIReady } from '@/utils/youtube';
import { RangeSlider } from './RangeSlider';
import { parseTime } from '@/utils/time';
import { TimeRangeFields } from './TimeRangeFields';

interface YouTubeInputSectionProps {
    url?: string;
    setUrl?: (url: string) => void;
    urlError?: string;
    showUrlInput?: boolean;
    youtubeId: string;
    onDurationReady?: (duration: number) => void;
    duration?: number;
    timeStart?: string;
    timeEnd?: string;
    setTimeStart?: (val: string) => void;
    setTimeEnd?: (val: string) => void;
    onRangeChange?: (start: number, end: number) => void;
}

export const YouTubeInputSection = ({
    url = '',
    setUrl = () => { },
    urlError = '',
    showUrlInput = true,
    youtubeId,
    onDurationReady,
    duration = 0,
    timeStart = '',
    timeEnd = '',
    setTimeStart = () => { },
    setTimeEnd = () => { },
    onRangeChange,
}: YouTubeInputSectionProps) => {
    const playerRef = useRef<any>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const [playerState, setPlayerState] = useState<number>(-1); // -1: UNSTARTED
    const [hasModifiedRange, setHasModifiedRange] = useState(false);
    const [isMobileSlider, setIsMobileSlider] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const onDurationReadyRef = useRef(onDurationReady);
    useEffect(() => {
        onDurationReadyRef.current = onDurationReady;
    }, [onDurationReady]);

    useEffect(() => {
        let isMounted = true;

        const initPlayer = async () => {
            if (!youtubeId) return;

            await ensureYouTubeIframeAPIReady();
            if (!isMounted) return;

            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) { }
                playerRef.current = null;
            }

            playerRef.current = new window.YT.Player('preview-player', {
                videoId: youtubeId,
                playerVars: {
                    autoplay: 0,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                },
                events: {
                    onReady: (event: any) => {
                        if (onDurationReadyRef.current) {
                            onDurationReadyRef.current(event.target.getDuration());
                        }
                    },
                    onStateChange: (event: any) => {
                        setPlayerState(event.data);
                        // If user manually pauses or video ends, stop previewing
                        if (event.data === 2 || event.data === 0) { // 2 is PAUSED, 0 is ENDED
                            setIsPreviewing(false);
                        }
                        // Automatically restore sound whenever the video starts playing
                        if (event.data === 1) { // 1 is PLAYING
                            try {
                                if (event.target.isMuted()) {
                                    event.target.unMute();
                                }
                            } catch (e) { }
                        }
                    }
                }
            });
        };

        initPlayer();

        return () => {
            isMounted = false;
            if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) { }
            }
        };
    }, [youtubeId]);

    // Handle ResizeObserver for dynamic slider positioning
    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setIsMobileSlider(entry.contentRect.width < 640);
            }
        });

        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [youtubeId]);

    // Preview range logic with high-precision requestAnimationFrame
    useEffect(() => {
        if (!isPreviewing || !playerRef.current) return;

        const endSeconds = parseTime(timeEnd);
        let rafId: number;

        const checkTime = () => {
            if (playerRef.current && isPreviewing) {
                try {
                    const currentTime = playerRef.current.getCurrentTime();
                    // Increased precision with 0.02s buffer
                    if (currentTime >= endSeconds - 0.02) {
                        playerRef.current.mute(); // Immediate silence
                        playerRef.current.pauseVideo();
                        playerRef.current.seekTo(endSeconds, true); // Freeze on exact frame
                        setIsPreviewing(false);
                        return; // Stop loop
                    }
                    rafId = requestAnimationFrame(checkTime);
                } catch (e) {
                    setIsPreviewing(false);
                }
            } else {
                setIsPreviewing(false);
            }
        };

        rafId = requestAnimationFrame(checkTime);
        return () => cancelAnimationFrame(rafId);
    }, [isPreviewing, timeEnd]);

    const handleTogglePreview = useCallback(() => {
        if (!playerRef.current) return;

        if (isPreviewing) {
            playerRef.current.mute(); // Immediate silence
            playerRef.current.pauseVideo();
            setIsPreviewing(false);
        } else {
            const startSeconds = parseTime(timeStart);
            playerRef.current.unMute(); // Ensure sound is on for preview
            playerRef.current.seekTo(startSeconds, true);
            playerRef.current.playVideo();
            setIsPreviewing(true);
            setHasModifiedRange(false); // Hide button after it's been used once
        }
    }, [isPreviewing, timeStart]);

    const handleRangeChangeInternal = useCallback((start: number, end: number) => {
        if (onRangeChange) {
            onRangeChange(start, end);
            setHasModifiedRange(true);
        }
    }, [onRangeChange]);

    // Debounced seek to timeStart
    useEffect(() => {
        if (!playerRef.current || !timeStart || isPreviewing) return;

        const timer = setTimeout(() => {
            try {
                const seconds = parseTime(timeStart);
                const player = playerRef.current;

                // Only seek if we are more than 0.1s away (avoid jitter)
                const current = player.getCurrentTime();
                if (Math.abs(current - seconds) < 0.1) return;

                player.seekTo(seconds, true);

                // Only trigger play/pause cycle if not already playing
                const state = player.getPlayerState();
                if (state !== 1) { // 1 is YT.PlayerState.PLAYING
                    player.mute(); // Silent render
                    player.playVideo();
                    setTimeout(() => {
                        if (playerRef.current) {
                            playerRef.current.pauseVideo();
                            playerRef.current.unMute();
                        }
                    }, 100); // Reduced delay and made it silent
                }
            } catch (e) {
                console.error('Seek error:', e);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [timeStart, isPreviewing]);

    const isPlaying = playerState === 1 || playerState === 3; // 1: PLAYING, 3: BUFFERING

    return (
        <div className="space-y-6">
            {showUrlInput && (
                <div className="space-y-2">
                    <Label htmlFor="segment-url" className="text-sm font-bold ml-1">Ссылка на YouTube</Label>
                    <Input
                        id="segment-url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Вставьте ссылку..."
                        className={`h-14 rounded-2xl bg-muted/30 border-none shadow-inner transition-all ${urlError ? 'ring-2 ring-red-500/50' : ''}`}
                    />
                    {urlError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1">{urlError}</p>}
                </div>
            )}

            {youtubeId && (
                <div className="animate-in zoom-in-95 duration-300 space-y-4">
                    <div ref={containerRef} className="w-full aspect-video relative group">
                        {/* Video Container with overflow-hidden */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-black/5 dark:ring-white/5 bg-black">
                            <div id="preview-player" className="absolute inset-0 w-full h-full" />

                            {!playerRef.current && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-white/20" />
                                </div>
                            )}
                        </div>

                        {/* Overlays and Slider (outside overflow-hidden) */}

                        {/* YouTube Style Play Button Overlay */}
                        {!isPlaying && !isPreviewing && hasModifiedRange && (
                            <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none transition-all duration-300">
                                <button
                                    type="button"
                                    onClick={handleTogglePreview}
                                    className="pointer-events-auto w-[64px] h-[46px] flex items-center justify-center hover:scale-[1.1] active:scale-95 transition-transform duration-200"
                                    aria-label="Preview Segment"
                                >
                                    <svg viewBox="0 0 68 48" className="h-full w-full drop-shadow-2xl">
                                        <path
                                            d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,0.13,34,0.13,34,0.13s-21.79,0-27.1,1.42C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19C12.21,47.87,34,47.87,34,47.87s21.79,0,27.1-1.42c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"
                                            fill="#f00"
                                        />
                                        <path d="M 45,24 27,14 27,34 z" fill="#fff" />
                                    </svg>
                                </button>
                            </div>
                        )}

                        {isPreviewing && (
                            <div className="absolute top-4 right-4 z-20 animate-in fade-in zoom-in duration-300">
                                <button
                                    type="button"
                                    onClick={handleTogglePreview}
                                    className="h-10 w-10 bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-all border border-white/20"
                                >
                                    <Square className="h-4 w-4 fill-current" />
                                </button>
                            </div>
                        )}

                        {duration > 0 && onRangeChange && (
                            <div
                                className="absolute left-0 right-0 p-0 z-30 transition-all duration-300"
                                style={{ bottom: isMobileSlider ? '37px' : '42px' }}
                            >
                                <RangeSlider
                                    duration={duration}
                                    timeStart={parseTime(timeStart) || 0}
                                    timeEnd={parseTime(timeEnd) || duration}
                                    onChange={handleRangeChangeInternal}
                                    className="px-0"
                                    isFullWidth
                                />
                            </div>
                        )}
                    </div>

                    <TimeRangeFields
                        timeStart={timeStart}
                        timeEnd={timeEnd}
                        onChangeStart={setTimeStart}
                        onChangeEnd={setTimeEnd}
                        duration={duration}
                    />
                </div>
            )}
        </div>
    );
};
