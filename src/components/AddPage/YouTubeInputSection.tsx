import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, Square, Timer, ChevronLeft, ChevronRight } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ensureYouTubeIframeAPIReady } from '@/utils/youtube';
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
    const playerRef = useRef<any>(null);
    const [isPreviewing, setIsPreviewing] = useState(false);

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
        }
    }, [isPreviewing, timeStart]);

    const captureStartTime = () => {
        if (playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            setTimeStart(formatTime(currentTime, true));
        }
    };

    const captureEndTime = () => {
        if (playerRef.current) {
            const currentTime = playerRef.current.getCurrentTime();
            setTimeEnd(formatTime(currentTime, true));
        }
    };



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

                            {!playerRef.current && (
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
                                onClick={captureStartTime}
                                variant="outline"
                                className="h-12 rounded-2xl border-dashed border-2 hover:border-brand hover:text-brand transition-all flex items-center gap-2 group"
                            >
                                <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                <span className="text-xs font-black uppercase tracking-widest">Старт здесь</span>
                                <Timer className="h-4 w-4 opacity-30" />
                            </Button>
                            <Button
                                type="button"
                                onClick={captureEndTime}
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
                            variant="secondary"
                            className={`h-12 rounded-2xl font-bold transition-all ${isPreviewing ? 'bg-brand text-white' : 'bg-accent/10 text-accent hover:bg-accent/20'}`}
                        >
                            {isPreviewing ? 'Остановить превью' : 'Предпросмотр отрезка'}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
