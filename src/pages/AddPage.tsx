import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage } from '../utils/storage';
import { fetchFragmentTitle, ensureYouTubeIframeAPIReady } from '../utils/youtube';
import { parseTime } from '../utils/time';
import type { Playlist } from '../types';
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
    const existingPlaylistId = searchParams.get('playlistId') || '';

    const isNewPlaylistMode = !existingPlaylistId;

    // Playlist fields (new playlist mode only)
    const [playlistName, setPlaylistName] = useState('');

    // Fragment fields
    const [url, setUrl] = useState('');
    const [youtubeId, setYoutubeId] = useState('');
    const [title, setTitle] = useState('');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);
    const [description, setDescription] = useState('');
    const [useRange, setUseRange] = useState(false);
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');

    // For "add to existing" mode
    const [playlistId, setPlaylistId] = useState(existingPlaylistId);
    const [playlists, setPlaylists] = useState<Playlist[]>([]);

    // Validation & state
    const [error, setError] = useState('');
    const [urlError, setUrlError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const validationPlayerRef = useRef<any>(null);
    const validationContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isNewPlaylistMode) {
            setPlaylists(storage.getPlaylists());
        }
    }, [isNewPlaylistMode]);

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
                fetchFragmentTitle(newId).then((fetchedTitle: string | null) => {
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


    // Validate fragment via hidden iframe
    const validateFragment = useCallback((videoId: string): Promise<boolean> => {
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

        if (isNewPlaylistMode && !playlistName.trim()) {
            setError('Введите название плейлиста');
            return;
        }
        if (!youtubeId) {
            setError('Введите корректную ссылку');
            return;
        }
        if (!isNewPlaylistMode && !playlistId) {
            setError('Выберите плейлист');
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

        // Validate fragment via iframe
        setIsValidating(true);
        const isValid = await validateFragment(youtubeId);
        setIsValidating(false);

        if (!isValid) {
            setError('Фрагмент недоступен или указан неправильный URL');
            return;
        }

        const fragmentData = {
            youtubeId,
            title: title || 'Новый фрагмент',
            description,
            isVertical: url.includes('/shorts/'),
            timeStart: useRange ? timeStart : null,
            timeEnd: useRange ? timeEnd : null,
        };

        if (isNewPlaylistMode) {
            storage.addPlaylistWithFragment(playlistName.trim(), fragmentData);
        } else {
            storage.addFragment(fragmentData, playlistId);
        }

        navigate('/playlists');
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
                title={isNewPlaylistMode ? 'Новый плейлист' : 'Добавить фрагмент'}
                backPath={-1}
            />

            <main className="p-5 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="flex flex-col gap-6">
                    {isNewPlaylistMode && (
                        <div className="space-y-2">
                            <Label htmlFor="playlist-name" className="text-sm font-bold ml-1">Название плейлиста</Label>
                            <Input
                                id="playlist-name"
                                value={playlistName}
                                onChange={(e) => setPlaylistName(e.target.value)}
                                placeholder="Напр. Мои любимые клипы"
                                className="h-14 rounded-2xl bg-muted/30 border-none shadow-inner"
                                autoFocus
                            />
                        </div>
                    )}

                    {!isNewPlaylistMode && (
                        <div className="space-y-2">
                            <Label className="text-sm font-bold ml-1">Выберите плейлист</Label>
                            <select
                                value={playlistId}
                                onChange={(e) => setPlaylistId(e.target.value)}
                                className="w-full h-14 px-4 bg-muted/30 border-none rounded-2xl outline-none text-foreground font-semibold shadow-inner appearance-none transition-all focus:ring-2 focus:ring-accent/20"
                            >
                                <option value="">Плейлист...</option>
                                {playlists.map(p => (
                                    <option key={p.uuid} value={p.uuid}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="fragment-url" className="text-sm font-bold ml-1">Ссылка на YouTube</Label>
                        <Input
                            id="fragment-url"
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
                            <Label htmlFor="fragment-title" className="text-sm font-bold ml-1">Название фрагмента</Label>
                            <div className="relative">
                                <Input
                                    id="fragment-title"
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
                        <Label htmlFor="fragment-desc" className="text-sm font-bold ml-1">Описание (необязательно)</Label>
                        <textarea
                            id="fragment-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Добавьте заметки..."
                            className="w-full min-h-[120px] p-4 bg-muted/30 border-none rounded-2xl outline-none text-foreground font-medium shadow-inner transition-all focus:ring-2 focus:ring-accent/20 resize-none"
                        />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                        <Label htmlFor="range-toggle" className="text-sm font-bold cursor-pointer">
                            Использовать фрагмент
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
                            {isNewPlaylistMode ? 'Создать плейлист' : 'Добавить фрагмент'}
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
