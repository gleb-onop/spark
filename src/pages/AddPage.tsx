import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { storage } from '../utils/storage';
import { fetchVideoTitle } from '../utils/youtube';
import type { Playlist } from '../types';

const AddPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const initialPlaylistId = searchParams.get('playlistId') || '';

    const [url, setUrl] = useState('');
    const [youtubeId, setYoutubeId] = useState('');
    const [title, setTitle] = useState('');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);
    const [playlistId, setPlaylistId] = useState(initialPlaylistId);
    const [description, setDescription] = useState('');
    const [useRange, setUseRange] = useState(false);
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [error, setError] = useState('');
    const [urlError, setUrlError] = useState('');

    useEffect(() => {
        setPlaylists(storage.getPlaylists());
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
            if (match) {
                const newId = match[1];
                setYoutubeId(newId);
                setUrlError('');
                // Auto-fetch title
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

    const handleSave = () => {
        if (!youtubeId) {
            setError('Введите корректную ссылку');
            return;
        }
        if (!playlistId) {
            setError('Выберите плейлист');
            return;
        }
        if (useRange) {
            if (!timeStart || !timeEnd) {
                setError('Заполните оба поля времени');
                return;
            }
            // Simple format check (m:ss or s)
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

        storage.addVideo({
            youtubeId,
            title: title || 'Новое видео',
            description,
            isVertical: url.includes('/shorts/'),
            timeStart: useRange ? timeStart : null,
            timeEnd: useRange ? timeEnd : null,
        }, playlistId);

        navigate('/playlists');
    };

    return (
        <div className="px-5 pt-5 pb-24">
            <h2 className="text-2xl mb-6 font-extrabold">Добавить видео</h2>

            <div className="flex flex-col gap-5">
                <div>
                    <label className="block text-sm mb-2 font-semibold">YouTube URL</label>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className={`w-full p-4 rounded-xl border bg-gray-50 dark:bg-white/5 text-inherit text-sm outline-none focus:border-accent transition-colors ${urlError ? 'border-red-500' : 'border-gray-300 dark:border-white/20'}`}
                    />
                    {urlError && <div className="text-red-500 text-xs mt-1">{urlError}</div>}
                </div>

                {youtubeId && (
                    <div className="w-full aspect-video relative rounded-xl overflow-hidden border-2 border-accent">
                        <img
                            src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                            alt="Preview"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                )}

                {youtubeId && (
                    <div>
                        <label className="block text-sm mb-2 font-semibold">Название</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={isFetchingTitle ? 'Загрузка...' : 'Название видео'}
                                className="w-full p-4 rounded-xl border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-inherit text-sm outline-none focus:border-accent transition-colors"
                            />
                            {isFetchingTitle && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                    </div>
                )}

                <div className="relative">
                    <label className="block text-sm mb-2 font-semibold">Плейлист</label>
                    <div className="relative">
                        <select
                            value={playlistId}
                            onChange={(e) => setPlaylistId(e.target.value)}
                            className="w-full p-4 pr-10 rounded-xl border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-inherit text-sm outline-none appearance-none cursor-pointer focus:border-accent transition-colors"
                        >
                            <option value="" className="bg-bg-light dark:bg-bg-dark">Выберите плейлист</option>
                            {playlists.map(p => (
                                <option key={p.uuid} value={p.uuid} className="bg-bg-light dark:bg-bg-dark">{p.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-inactive">
                            ▼
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm mb-2 font-semibold">Описание (необязательно)</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="О чем это видео..."
                        className="w-full p-4 rounded-xl border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-inherit text-sm min-h-[100px] outline-none resize-none focus:border-accent transition-colors"
                    />
                </div>

                <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-semibold">Временной диапазон</span>
                    <button
                        onClick={() => setUseRange(!useRange)}
                        className={`w-11 h-6 rounded-full border-none relative transition-colors cursor-pointer p-0 ${useRange ? 'bg-accent' : 'bg-inactive'}`}
                    >
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-[2px] transition-all ${useRange ? 'left-[22px]' : 'left-[2px]'}`} />
                    </button>
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
                                className="w-full p-3 rounded-lg border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 text-inherit text-sm outline-none focus:border-accent transition-colors"
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
                    className="w-full h-14 bg-accent rounded-2xl text-white border-none text-base font-bold mt-2 shadow-[0_4px_12px_rgba(255,107,53,0.3)] cursor-pointer hover:brightness-110 transition-all"
                >
                    Сохранить
                </button>
            </div>
        </div>
    );
};

export default AddPage;
