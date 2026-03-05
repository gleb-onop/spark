import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { fetchSegmentTitle, ensureYouTubeIframeAPIReady } from '../utils/youtube';
import { parseTime } from '../utils/time';
import type { SegmentedVideo } from '../types';
import { Plus, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
    }
}

const AddPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const existingSegmentedVideoId = searchParams.get('segmentedVideoId') || '';

    const isNewSegmentedVideoMode = !existingSegmentedVideoId;

    // SegmentedVideo fields (new partitioned video mode only)
    const [segmentedVideoName, setSegmentedVideoName] = useState('');

    // Segment fields
    const [url, setUrl] = useState('');
    const [youtubeId, setYoutubeId] = useState('');
    const [title, setTitle] = useState('');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);
    const [description, setDescription] = useState('');
    const [useRange, setUseRange] = useState(false);
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');

    // For "add to existing" mode
    const [segmentedVideoId, setSegmentedVideoId] = useState(existingSegmentedVideoId);
    const [segmentedVideos, setSegmentedVideos] = useState<SegmentedVideo[]>([]);

    // Validation & state
    const [error, setError] = useState('');
    const [urlError, setUrlError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const validationPlayerRef = useRef<any>(null);
    const validationContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isNewSegmentedVideoMode) {
            const loadSegmentedVideos = async () => {
                const data = await api.getSegmentedVideos();
                setSegmentedVideos(data);
            };
            loadSegmentedVideos();
        }
    }, [isNewSegmentedVideoMode]);

    // Parse youtubeId from URL with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            // Robust regex covering watch, shorts, embed, live and youtu.be
            const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([a-zA-Z0-9_-]{11})/);
            let newId = match ? match[1] : '';

            // Fallback for plain ID if it's exactly 11 chars
            if (!newId && url.trim().length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
                newId = url.trim();
            }

            if (newId) {
                setYoutubeId(newId);
                setUrlError('');
                setIsFetchingTitle(true);
                fetchSegmentTitle(newId).then((fetchedTitle: string | null) => {
                    if (fetchedTitle) setTitle(fetchedTitle);
                    setIsFetchingTitle(false);
                });
            } else if (url) {
                setYoutubeId('');
                setTitle('');
                setUrlError('Не удалось распознать ссылку');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [url]);


    // Validate segment via hidden iframe
    const validateSegment = useCallback((videoId: string): Promise<boolean> => {
        return new Promise(async (resolve) => {
            await ensureYouTubeIframeAPIReady();

            if (validationPlayerRef.current) {
                validationPlayerRef.current.destroy();
                validationPlayerRef.current = null;
            }

            const timeout = setTimeout(() => {
                if (validationPlayerRef.current) {
                    validationPlayerRef.current.destroy();
                    validationPlayerRef.current = null;
                }
                resolve(false);
            }, 8000);

            validationPlayerRef.current = new window.YT.Player('validation-player', {
                width: 1,
                height: 1,
                videoId: videoId,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    mute: 1,
                },
                events: {
                    onReady: () => {
                        clearTimeout(timeout);
                        if (validationPlayerRef.current) {
                            validationPlayerRef.current.destroy();
                            validationPlayerRef.current = null;
                        }
                        resolve(true);
                    },
                    onError: () => {
                        clearTimeout(timeout);
                        if (validationPlayerRef.current) {
                            validationPlayerRef.current.destroy();
                            validationPlayerRef.current = null;
                        }
                        resolve(false);
                    },
                },
            });
        });
    }, []);

    const handleSave = async () => {
        setError('');

        if (isNewSegmentedVideoMode && !segmentedVideoName.trim()) {
            setError('Введите название сегментированного видео');
            return;
        }
        if (!youtubeId) {
            setError('Введите корректную ссылку');
            return;
        }
        if (!isNewSegmentedVideoMode && !segmentedVideoId) {
            setError('Выберите сегментированное видео');
            return;
        }
        if (useRange) {
            if (!timeStart || !timeEnd) {
                setError('Заполните оба поля времени');
                return;
            }
            if (parseTime(timeEnd) <= parseTime(timeStart)) {
                setError('Конец должен быть позже начала');
                return;
            }
        }

        // Validate segment via iframe
        setIsValidating(true);
        const isValid = await validateSegment(youtubeId);

        if (!isValid) {
            setError('Сегмент недоступен или указан неправильный URL');
            setIsValidating(false);
            return;
        }

        const videoData = {
            uuid: crypto.randomUUID(),
            youtubeId,
            title: title || 'Новое видео',
            description: '',
            duration: 0, // Should be fetched but okay for now
            isEmbeddable: true,
            isVertical: url.includes('/shorts/'),
            createdAt: Date.now()
        };

        const segmentData = {
            description,
            timeStart: useRange ? timeStart : null,
            timeEnd: useRange ? timeEnd : null,
            video: videoData
        };

        try {
            if (isNewSegmentedVideoMode) {
                await api.addSegmentedVideoWithSegment(segmentedVideoName.trim(), segmentData);
            } else {
                await api.addSegment(segmentData, segmentedVideoId);
            }
            navigate('/segmented-videos');
        } catch (e) {
            console.error('Error saving data:', e);
            setError('Произошла ошибка при сохранении');
        } finally {
            setIsValidating(false);
        }
    };


    // Cleanup validation player on unmount
    useEffect(() => {
        return () => {
            if (validationPlayerRef.current) {
                validationPlayerRef.current.destroy();
            }
        };
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            <PageHeader
                title={isNewSegmentedVideoMode ? 'Новое сегментированное видео' : 'Добавить сегмент'}
                backPath={-1}
            />

            <main className="p-5 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="flex flex-col gap-6">
                    {isNewSegmentedVideoMode && (
                        <div className="space-y-2">
                            <Label htmlFor="segmented-video-name" className="text-sm font-bold ml-1">Название сегментированного видео</Label>
                            <Input
                                id="segmented-video-name"
                                value={segmentedVideoName}
                                onChange={(e) => setSegmentedVideoName(e.target.value)}
                                placeholder="Напр. Мои любимые клипы"
                                className="h-14 rounded-2xl bg-muted/30 border-none shadow-inner"
                                autoFocus
                            />
                        </div>
                    )}

                    {!isNewSegmentedVideoMode && (
                        <div className="space-y-2">
                            <Label className="text-sm font-bold ml-1">Выберите сегментированное видео</Label>
                            <select
                                value={segmentedVideoId}
                                onChange={(e) => setSegmentedVideoId(e.target.value)}
                                className="w-full h-14 px-4 bg-muted/30 border-none rounded-2xl outline-none text-foreground font-semibold shadow-inner appearance-none transition-all focus:ring-2 focus:ring-accent/20"
                            >
                                <option value="">Сегментированное видео...</option>
                                {segmentedVideos.map(p => (
                                    <option key={p.uuid} value={p.uuid}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

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

                    {youtubeId && (
                        <div className="animate-in zoom-in-95 duration-300">
                            <div className="w-full aspect-video relative rounded-2xl overflow-hidden shadow-2xl ring-4 ring-black/5 dark:ring-white/5">
                                <img
                                    src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                                    alt="Превью"
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </div>
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

                    <div className="space-y-2">
                        <Label htmlFor="segment-desc" className="text-sm font-bold ml-1">Описание (необязательно)</Label>
                        <textarea
                            id="segment-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Добавьте заметки..."
                            className="w-full min-h-[120px] p-4 bg-muted/30 border-none rounded-2xl outline-none text-foreground font-medium shadow-inner transition-all focus:ring-2 focus:ring-accent/20 resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                        <Label htmlFor="range-toggle" className="text-sm font-bold cursor-pointer">
                            Использовать только сегмент
                        </Label>
                        <Switch
                            id="range-toggle"
                            checked={useRange}
                            onCheckedChange={setUseRange}
                        />
                    </div>

                    {useRange && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                            <div className="space-y-2">
                                <Label htmlFor="start" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Старт (м:сс)</Label>
                                <Input
                                    id="start"
                                    value={timeStart}
                                    onChange={(e) => setTimeStart(e.target.value)}
                                    placeholder="0:00"
                                    className="h-12 rounded-xl bg-muted/30 border-none shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="end" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Конец (м:сс)</Label>
                                <Input
                                    id="end"
                                    value={timeEnd}
                                    onChange={(e) => setTimeEnd(e.target.value)}
                                    placeholder="1:00"
                                    className="h-12 rounded-xl bg-muted/30 border-none shadow-inner"
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 animate-in shake-1 duration-500">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <p className="text-red-500 text-xs font-bold leading-tight">{error}</p>
                        </div>
                    )}
                </section>

                <Button
                    size="lg"
                    onClick={handleSave}
                    disabled={isValidating}
                    className="h-16 rounded-2xl shadow-xl shadow-accent/30 font-bold text-lg transition-transform active:scale-95"
                >
                    {isValidating ? (
                        <>
                            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                            Проверка доступности...
                        </>
                    ) : (
                        <>
                            <Plus className="mr-2 h-6 w-6" />
                            {isNewSegmentedVideoMode ? 'Создать' : 'Добавить сегмент'}
                        </>
                    )}
                </Button>
            </main>

            <div ref={validationContainerRef} className="absolute -left-[9999px] -top-[9999px] w-px h-px overflow-hidden">
                <div id="validation-player" />
            </div>
        </div>
    );
};

export default AddPage;
