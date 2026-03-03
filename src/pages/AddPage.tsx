import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage } from '../utils/storage';
import { fetchVideoTitle } from '../utils/youtube';
import type { Playlist } from '../types';
import { ChevronLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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

    // Video fields
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
            const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
            if (match) {
                const newId = match[1];
                setYoutubeId(newId);
                setUrlError('');
                setIsFetchingTitle(true);
                fetchVideoTitle(newId).then(fetchedTitle => {
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

    // Load YT API if not loaded
    const ensureYTLoaded = useCallback((): Promise<void> => {
        return new Promise((resolve) => {
            if (window.YT && window.YT.Player) {
                resolve();
                return;
            }
            const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
            if (existingScript) {
                const check = setInterval(() => {
                    if (window.YT && window.YT.Player) {
                        clearInterval(check);
                        resolve();
                    }
                }, 100);
                return;
            }
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = () => resolve();
        });
    }, []);

    // Validate video via hidden iframe
    const validateVideo = useCallback((videoId: string): Promise<boolean> => {
        return new Promise(async (resolve) => {
            await ensureYTLoaded();

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
    }, [ensureYTLoaded]);

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
            const parseTime = (str: string) => {
                if (str.includes(':')) {
                    const [m, s] = str.split(':').map(Number);
                    return m * 60 + s;
                }
                return Number(str);
            };
            if (parseTime(timeEnd) <= parseTime(timeStart)) {
                setError('Конец должен быть позже начала');
                return;
            }
        }

        // Validate video via iframe
        setIsValidating(true);
        const isValid = await validateVideo(youtubeId);
        setIsValidating(false);

        if (!isValid) {
            setError('Видео недоступно или указан неправильный URL');
            return;
        }

        const videoData = {
            youtubeId,
            title: title || 'Новое видео',
            description,
            isVertical: url.includes('/shorts/'),
            timeStart: useRange ? timeStart : null,
            timeEnd: useRange ? timeEnd : null,
        };

        if (isNewPlaylistMode) {
            storage.addPlaylistWithVideo(playlistName.trim(), videoData);
        } else {
            storage.addVideo(videoData, playlistId);
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
        <div className="px-5 pt-5 pb-24">
            <header className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-transparent border-none text-inherit hover:bg-muted p-2 rounded-full transition-colors shrink-0"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h2 className="text-2xl font-extrabold m-0">
                    {isNewPlaylistMode ? 'Новый плейлист' : 'Добавить видео'}
                </h2>
            </header>

            <div className="flex flex-col gap-5">
                {/* Playlist name (new playlist mode) */}
                {isNewPlaylistMode && (
                    <div>
                        <label className="block text-sm mb-2 font-semibold">Название плейлиста</label>
                        <input
                            type="text"
                            value={playlistName}
                            onChange={(e) => setPlaylistName(e.target.value)}
                            placeholder="Мой плейлист"
                            autoFocus
                            className="w-full p-4 rounded-xl border border-border bg-input text-inherit text-base outline-none focus:border-accent transition-colors shadow-sm"
                        />
                    </div>
                )}

                {/* Divider between playlist and video sections */}
                {isNewPlaylistMode && (
                    <div className="flex items-center gap-3 my-1">
                        <div className="flex-1 h-px bg-border" />
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Первое видео</span>
                        <div className="flex-1 h-px bg-border" />
                    </div>
                )}

                {/* YouTube URL */}
                <div>
                    <label className="block text-sm mb-2 font-semibold">YouTube URL</label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className={`w-full p-4 rounded-xl border bg-input text-inherit text-sm outline-none focus:border-accent transition-colors shadow-sm ${urlError ? 'border-red-500' : 'border-border'}`}
                    />
                    {urlError && <div className="text-red-500 text-xs mt-1">{urlError}</div>}
                </div>

                {/* Preview */}
                {youtubeId && (
                    <div className="w-full aspect-video relative rounded-xl overflow-hidden border-2 border-accent">
                        <img
                            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Title (auto-fetched) */}
                {youtubeId && (
                    <div>
                        <label className="block text-sm mb-2 font-semibold">Название</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={isFetchingTitle ? 'Загрузка...' : 'Название видео'}
                                className="w-full p-4 rounded-xl border border-border bg-input text-inherit text-sm outline-none focus:border-accent transition-colors shadow-sm"
                            />
                            {isFetchingTitle && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                    </div>
                )}

                {/* Playlist selector (add to existing mode) */}
                {!isNewPlaylistMode && (
                    <div className="relative">
                        <label className="block text-sm mb-2 font-semibold">Плейлист</label>
                        <div className="relative">
                            <select
                                value={playlistId}
                                onChange={(e) => setPlaylistId(e.target.value)}
                                className="w-full p-4 pr-10 rounded-xl border border-border bg-input text-inherit text-sm outline-none appearance-none cursor-pointer focus:border-accent transition-colors shadow-sm"
                            >
                                <option value="" className="bg-background">Выберите плейлист</option>
                                {playlists.map(p => (
                                    <option key={p.uuid} value={p.uuid} className="bg-background">{p.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-muted-foreground">
                                ▼
                            </div>
                        </div>
                    </div>
                )}

                {/* Description */}
                <div>
                    <label className="block text-sm mb-2 font-semibold">Описание (необязательно)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="О чем это видео..."
                        className="w-full p-4 rounded-xl border border-border bg-input text-inherit text-sm min-h-[100px] outline-none resize-none focus:border-accent transition-colors shadow-sm"
                    />
                </div>

                {/* Time range toggle */}
                <div className="flex items-center justify-between mt-2">
                    <Label htmlFor="use-range" className="text-sm font-semibold cursor-pointer">Временной диапазон</Label>
                    <Switch
                        id="use-range"
                        checked={useRange}
                        onCheckedChange={setUseRange}
                        className="data-[state=checked]:bg-accent"
                    />
                </div>

                {useRange && (
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-xs mb-1 text-inactive">Начало (m:ss)</label>
                            <input
                                type="text"
                                value={timeStart}
                                onChange={(e) => setTimeStart(e.target.value)}
                                placeholder="0:30"
                                className="w-full p-3 rounded-lg border border-border bg-input text-inherit text-sm outline-none focus:border-accent transition-colors shadow-sm"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs mb-1 text-inactive">Конец (m:ss)</label>
                            <input
                                type="text"
                                value={timeEnd}
                                onChange={(e) => setTimeEnd(e.target.value)}
                                placeholder="1:45"
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-inherit text-sm outline-none focus:border-accent transition-colors"
                            />
                        </div>
                    </div>
                )}

                {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                <button
                    onClick={handleSave}
                    disabled={isValidating}
                    className={`w-full h-14 rounded-2xl text-white border-none text-base font-bold mt-2 shadow-[0_4px_12px_rgba(255,107,53,0.3)] transition-all ${isValidating
                        ? 'bg-muted-foreground/50 cursor-wait'
                        : 'bg-accent cursor-pointer hover:brightness-110'
                        }`}
                >
                    {isValidating ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Проверяем видео…
                        </span>
                    ) : isNewPlaylistMode ? (
                        'Создать плейлист'
                    ) : (
                        'Сохранить'
                    )}
                </button>
            </div>

            {/* Hidden container for video validation iframe */}
            <div ref={validationContainerRef} className="absolute -left-[9999px] -top-[9999px] w-px h-px overflow-hidden">
                <div id="validation-player" />
            </div>
        </div>
    );
};

export default AddPage;
