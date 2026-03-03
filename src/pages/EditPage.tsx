import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storage } from '../utils/storage';
import type { Video } from '../types';
import { ChevronLeft, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Switch } from "../components/ui/switch";
import { Label } from "../components/ui/label";

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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

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
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
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
    };

    if (!video) return null;

    return (
        <div className="px-5 pt-5 pb-24 bg-background min-h-screen">
            <header className="flex items-center gap-4 mb-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-2">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="rounded-full"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
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
                    <Label className="block text-sm mb-2 font-semibold">Название</Label>
                    <Input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Введите название"
                    />
                </div>

                <div>
                    <Label className="block text-sm mb-2 font-semibold">Описание</Label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="flex w-full rounded-xl border border-input bg-transparent px-4 py-3 text-base transition-all placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[120px] resize-none"
                        placeholder="Добавьте описание..."
                    />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex flex-col gap-0.5">
                        <Label htmlFor="range-toggle" className="text-sm font-semibold cursor-pointer">Временной диапазон</Label>
                        <span className="text-xs text-muted-foreground">Вырезать отрывок из видео</span>
                    </div>
                    <Switch
                        id="range-toggle"
                        checked={useRange}
                        onCheckedChange={setUseRange}
                        className="data-[state=checked]:bg-accent"
                    />
                </div>

                {useRange && (
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label className="block text-xs mb-2 text-muted-foreground">Начало (m:ss)</Label>
                            <Input
                                type="text"
                                value={timeStart}
                                onChange={(e) => setTimeStart(e.target.value)}
                                placeholder="0:00"
                            />
                        </div>
                        <div className="flex-1">
                            <Label className="block text-xs mb-2 text-muted-foreground">Конец (m:ss)</Label>
                            <Input
                                type="text"
                                value={timeEnd}
                                onChange={(e) => setTimeEnd(e.target.value)}
                                placeholder="1:30"
                            />
                        </div>
                    </div>
                )}

                {error && <div className="text-red-500 text-sm text-center font-medium bg-red-500/10 py-3 rounded-lg border border-red-500/20">{error}</div>}

                <Button
                    size="lg"
                    onClick={handleSave}
                    className="w-full shadow-lg"
                >
                    Сохранить изменения
                </Button>

                <Button
                    variant="ghost"
                    onClick={handleDelete}
                    className="w-full text-red-500 hover:text-red-500 hover:bg-red-500/10 font-bold"
                >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Удалить видео
                </Button>
            </div>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить видео?</DialogTitle>
                        <DialogDescription>
                            Это действие полностью удалит видео из всех плейлистов. Его нельзя будет восстановить.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-2 mt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
                            Отмена
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={confirmDelete}>
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EditPage;
