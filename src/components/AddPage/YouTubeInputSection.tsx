import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
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
    youtubeId: string;
    title: string;
    setTitle: (title: string) => void;
    isFetchingTitle?: boolean;
    showUrlInput?: boolean;
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
    youtubeId,
    title,
    setTitle,
    isFetchingTitle = false,
    showUrlInput = true,
    onDurationReady,
    duration = 0,
    timeStart = '',
    timeEnd = '',
    setTimeStart = () => { },
    setTimeEnd = () => { },
    onRangeChange,
}: YouTubeInputSectionProps) => {
    const playerRef = useRef<any>(null);

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
                        if (onDurationReady) {
                            onDurationReady(event.target.getDuration());
                        }
                    },
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
    }, [youtubeId, onDurationReady]);

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
                    <div className="w-full aspect-video relative rounded-3xl overflow-hidden shadow-2xl ring-4 ring-black/5 dark:ring-white/5 bg-black flex flex-col">
                        <div id="preview-player" className="absolute inset-0 w-full h-full" />

                        {duration > 0 && onRangeChange && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
                                <RangeSlider
                                    duration={duration}
                                    timeStart={parseTime(timeStart) || 0}
                                    timeEnd={parseTime(timeEnd) || duration}
                                    onChange={onRangeChange}
                                    className="px-2"
                                />
                            </div>
                        )}

                        {!playerRef.current && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-white/20" />
                            </div>
                        )}
                    </div>

                    <TimeRangeFields
                        timeStart={timeStart}
                        timeEnd={timeEnd}
                        onChangeStart={setTimeStart}
                        onChangeEnd={setTimeEnd}
                    />
                </div>
            )}

            {youtubeId && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                    <Label htmlFor="segment-title" className="text-sm font-bold ml-1">Название видео</Label>
                    <div className="relative">
                        <Input
                            id="segment-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={isFetchingTitle ? 'Загрузка...' : 'Заголовок...'}
                            className="h-14 rounded-2xl bg-muted/30 border-none shadow-inner pr-12"
                        />
                        {isFetchingTitle && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
