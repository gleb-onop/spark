import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storage } from '../utils/storage';
import type { Video } from '../types';
import { ChevronLeft } from 'lucide-react';

const EditPage = () => {
    const { videoId } = useParams<{ videoId: string }>();
    const navigate = useNavigate();

    const [video, setVideo] = useState<Video | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [useRange, setUseRange] = useState(false);
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!videoId) return;
        const allVideos = storage.getVideos();
        const current = allVideos.find(v => v.uuid === videoId);
        if (current) {
            setVideo(current);
            setTitle(current.title);
            setDescription(current.description);
            setUseRange(!!current.timeStart);
            setTimeStart(current.timeStart || '');
            setTimeEnd(current.timeEnd || '');
        } else {
            navigate('/playlists');
        }
    }, [videoId, navigate]);

    const handleSave = () => {
        if (!video) return;
        if (useRange && (!timeStart || !timeEnd)) {
            setError('Заполните оба поля времени');
            return;
        }

        const videos = storage.getVideos();
        const updatedVideos = videos.map(v => {
            if (v.uuid === videoId) {
                return {
                    ...v,
                    title,
                    description,
                    timeStart: useRange ? timeStart : null,
                    timeEnd: useRange ? timeEnd : null,
                };
            }
            return v;
        });

        storage.saveVideos(updatedVideos);
        navigate(-1);
    };

    const handleDelete = () => {
        if (window.confirm('Удалить видео совсем?')) {
            const allVideos = storage.getVideos();
            const newVideos = allVideos.filter(v => v.uuid !== videoId);
            storage.saveVideos(newVideos);

            const allPlaylists = storage.getPlaylists();
            const newPlaylists = allPlaylists.map(p => ({
                ...p,
                videoIds: p.videoIds.filter(id => id !== videoId)
            }));
            storage.savePlaylists(newPlaylists);

            navigate('/playlists');
        }
    };

    if (!video) return null;

    return (
        <div className="px-5 pt-5 pb-24">
            <header className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-transparent border-none text-inherit hover:bg-muted p-2 rounded-full transition-colors shrink-0"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h2 className="text-xl font-extrabold m-0">Редактировать</h2>
            </header>

            <div className="flex flex-col gap-5">
                <div className="w-full aspect-video relative rounded-xl overflow-hidden bg-black">
                    <img
                        src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
                        alt="Preview"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>

                <div>
                    <label className="block text-sm mb-2 font-semibold">Название</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-4 rounded-xl border border-border bg-input text-inherit text-sm outline-none focus:border-accent transition-colors shadow-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm mb-2 font-semibold">Описание</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-4 rounded-xl border border-border bg-input text-inherit text-sm min-h-[100px] outline-none resize-none focus:border-accent transition-colors shadow-sm"
                    />
                </div>

                <div className="flex items-center justify-between">
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
                                className="w-full p-3 rounded-lg border border-border bg-input text-inherit text-sm outline-none focus:border-accent transition-colors shadow-sm"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs mb-1 text-inactive">Конец (m:ss)</label>
                            <input
                                type="text"
                                value={timeEnd}
                                onChange={(e) => setTimeEnd(e.target.value)}
                                className="w-full p-3 rounded-lg border border-border bg-input text-inherit text-sm outline-none focus:border-accent transition-colors shadow-sm"
                            />
                        </div>
                    </div>
                )}

                {error && <div className="text-red-500 text-sm text-center">{error}</div>}

                <button
                    onClick={handleSave}
                    className="w-full h-14 bg-accent rounded-2xl text-white border-none text-base font-bold shadow-[0_4px_12px_rgba(255,107,53,0.3)] cursor-pointer hover:brightness-110 transition-all"
                >
                    Сохранить изменения
                </button>

                <button
                    onClick={handleDelete}
                    className="w-full h-12 bg-transparent rounded-xl text-red-500 border-none text-sm font-semibold mt-2 cursor-pointer hover:bg-red-500/10 transition-colors"
                >
                    Удалить видео
                </button>
            </div>
        </div>
    );
};

export default EditPage;
