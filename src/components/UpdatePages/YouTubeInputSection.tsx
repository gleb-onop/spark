import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Square, Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { type YTPlayer, type YTEvent, YTPlayerState } from '@/utils/youtube';
import { useYouTubeBase } from '@/hooks/useYouTubeBase';
import { useStableCallback } from '@/hooks/useStableCallback';
import { cn } from '@/lib/utils';
import { parseTime, formatTime } from '@/utils/time';
import { TimeRangeFields } from './TimeRangeFields';

const PREVIEW_STOP_BUFFER_SEC = 0.02;

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
}: YouTubeInputSectionProps) => {
    const playerRef = useRef<YTPlayer | null>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [isPreviewing, setIsPreviewing] = useState(false);
    const isStartingPreviewRef = useRef(false);
    const pendingSeekRef = useRef<number | null>(null);

    const stableOnDurationReady = useStableCallback(onDurationReady);

    useYouTubeBase({
        videoId: youtubeId,
        target: 'preview-player',
        playerRef,
        playerVars: {
            autoplay: 0,
            controls: 1,
        },
        events: {
            onReady: (event: YTEvent) => {
                setIsPlayerReady(true);
                stableOnDurationReady(event.target.getDuration());
            },
            onStateChange: (event: YTEvent) => {
                if (event.data === YTPlayerState.PLAYING) {
                    if (pendingSeekRef.current !== null) {
                        event.target.seekTo(pendingSeekRef.current, true);
                        pendingSeekRef.current = null;
                    }

                    isStartingPreviewRef.current = false;
                    try {
                        if (event.target.isMuted()) {
                            event.target.unMute();
                        }
                    } catch (e) { }
                }

                // If user manually pauses or video ends, stop previewing state (RAF loop)
                if (event.data === YTPlayerState.PAUSED || event.data === YTPlayerState.ENDED) {
                    // Ignore PAUSED state if we just started the preview (often a race condition with seekTo)
                    if (isStartingPreviewRef.current && event.data === YTPlayerState.PAUSED) {
                        return;
                    }
                    setIsPreviewing(false);
                }
            }
        }
    });

    // Reset ready state when video ID changes
    useEffect(() => {
        setIsPlayerReady(false);
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
                    // Increased precision with buffer
                    if (currentTime >= endSeconds - PREVIEW_STOP_BUFFER_SEC) {
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
        if (!playerRef.current || !isPlayerReady) return;

        if (isPreviewing) {
            playerRef.current.mute(); // Immediate silence
            playerRef.current.pauseVideo();
            setIsPreviewing(false);
        } else {
            const startSeconds = parseTime(timeStart);
            pendingSeekRef.current = startSeconds;
            isStartingPreviewRef.current = true;
            playerRef.current.unMute(); // Ensure sound is on for preview
            playerRef.current.playVideo();
            setIsPreviewing(true);
        }
    }, [isPreviewing, timeStart, isPlayerReady]);

    const captureTime = useCallback((setter: (val: string) => void) => {
        if (playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            setter(formatTime(currentTime, true));
        }
    }, []);

    const canPreview = isPlayerReady && !!youtubeId;

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
                <div className="animate-in zoom-in-95 duration-300 space-y-6">
                    <div className="w-full aspect-video relative group">
                        {/* Video Container with overflow-hidden */}
                        <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl ring-4 ring-black/5 dark:ring-white/5 bg-black">
                            <div id="preview-player" className="absolute inset-0 w-full h-full" />

                            {!isPlayerReady && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-white/20" />
                                </div>
                            )}
                        </div>

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
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                type="button"
                                onClick={() => captureTime(setTimeStart)}
                                variant="outline"
                                className="h-12 rounded-2xl border-dashed border-2 hover:border-brand hover:text-brand transition-all flex items-center gap-2 group"
                            >
                                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                <span className="text-xs font-black uppercase tracking-widest">Старт здесь</span>
                                <Timer className="h-4 w-4 opacity-30" />
                            </Button>
                            <Button
                                type="button"
                                onClick={() => captureTime(setTimeEnd)}
                                variant="outline"
                                className="h-12 rounded-2xl border-dashed border-2 hover:border-brand hover:text-brand transition-all flex items-center gap-2 group"
                            >
                                <Timer className="h-4 w-4 opacity-30" />
                                <span className="text-xs font-black uppercase tracking-widest">Конец здесь</span>
                                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>

                        <TimeRangeFields
                            timeStart={timeStart}
                            timeEnd={timeEnd}
                            onChangeStart={setTimeStart}
                            onChangeEnd={setTimeEnd}
                            duration={duration}
                        />

                        <Button
                            type="button"
                            onClick={handleTogglePreview}
                            disabled={!canPreview}
                            className={cn(
                                "h-14 rounded-2xl font-black uppercase tracking-widest transition-all",
                                isPreviewing
                                    ? "bg-brand text-white shadow-[0_8px_20px_rgb(255,107,53,0.3)] scale-[0.98]"
                                    : "bg-brand/10 text-brand hover:bg-brand/20 border-2 border-brand/20"
                            )}
                        >
                            {isPreviewing ? (
                                <div className="flex items-center gap-2">
                                    <Square className="h-4 w-4 fill-current" />
                                    <span>Остановить превью</span>
                                </div>
                            ) : (
                                "Предпросмотр отрезка"
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
