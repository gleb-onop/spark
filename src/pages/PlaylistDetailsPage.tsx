import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MoreVertical, Trash2, FolderOpen, Edit2, Plus, Play } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "../components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { storage } from '../utils/storage';
import { PageHeader } from '@/components/PageHeader';
import { VideoItem } from '@/components/VideoItem';
import { usePlaylist } from '@/hooks/usePlaylist';

const PlaylistDetailsPage = () => {
    const { playlistId } = useParams<{ playlistId: string }>();
    const navigate = useNavigate();
    const [videoToDelete, setVideoToDelete] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeletePlaylistModalOpen, setIsDeletePlaylistModalOpen] = useState(false);
    const [newName, setNewName] = useState('');

    const { playlist, videos, isLoading, deleteVideo, renamePlaylist } = usePlaylist(playlistId);

    const handleRename = () => {
        if (newName.trim()) {
            renamePlaylist(newName);
            setIsEditModalOpen(false);
        }
    };

    const handleDeletePlaylist = () => {
        if (!playlistId) return;
        storage.deletePlaylist(playlistId);
        navigate('/playlists');
    };

    if (isLoading) return null;
    if (!playlist) return <div className="p-8 text-center text-muted-foreground">Плейлист не найден</div>;

    return (
        <div className="flex flex-col min-h-screen bg-background pb-20">
            <PageHeader
                title={playlist.name}
                backPath="/playlists"
                actions={
                    <div className="flex items-center gap-2">
                        <Button size="icon" asChild className="rounded-full shadow-lg shadow-brand/20 bg-brand hover:bg-brand/90 text-white">
                            <Link to={`/add?playlistId=${playlist.uuid}`}>
                                <Plus className="h-5 w-5" />
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48 p-1">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setNewName(playlist.name);
                                        setIsEditModalOpen(true);
                                    }}
                                    className="rounded-lg gap-2"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    <span>Переименовать</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setIsDeletePlaylistModalOpen(true)}
                                    className="rounded-lg gap-2 text-red-500 focus:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Удалить список</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                }
            />

            <main className="flex-1 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-1">
                        <div className="text-3xl font-black tracking-tight">{playlist.name}</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            <FolderOpen className="h-3 w-3" />
                            {videos.length} видео
                        </div>
                    </div>
                    {videos.length > 0 && (
                        <Button
                            asChild
                            size="icon"
                            className="rounded-full h-14 w-14 shadow-xl shadow-brand/25 bg-brand text-white hover:bg-brand/90 flex items-center justify-center"
                        >
                            <Link to={`/video/${playlist.uuid}/${videos[0].uuid}`}>
                                <Play className="h-7 w-7 fill-current ml-1" />
                            </Link>
                        </Button>
                    )}
                </div>

                <div className="flex flex-col gap-5">
                    {videos.map((video) => (
                        <VideoItem
                            key={video.uuid}
                            video={video}
                            playlistId={playlist.uuid}
                            onDelete={(uuid) => setVideoToDelete(uuid)}
                        />
                    ))}
                </div>
            </main>

            {/* Modals */}
            <Dialog open={!!videoToDelete} onOpenChange={(open) => !open && setVideoToDelete(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Удалить видео?</DialogTitle>
                        <DialogDescription>
                            Это действие нельзя будет отменить. Видео будет удалено из текущего списка.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-2 mt-4">
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setVideoToDelete(null)}>
                            Отмена
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1 rounded-xl"
                            onClick={() => {
                                if (videoToDelete) {
                                    deleteVideo(videoToDelete);
                                    setVideoToDelete(null);
                                }
                            }}
                        >
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Редактировать название</DialogTitle>
                        <DialogDescription>
                            Введите новое название для плейлиста.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Название плейлиста"
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        />
                    </div>
                    <DialogFooter className="flex-row gap-2">
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsEditModalOpen(false)}>
                            Отмена
                        </Button>
                        <Button className="flex-1 rounded-xl shadow-lg" onClick={handleRename}>
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeletePlaylistModalOpen} onOpenChange={setIsDeletePlaylistModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Удалить плейлист?</DialogTitle>
                        <DialogDescription>
                            Вы уверены, что хотите удалить плейлист "{playlist.name}"? Это также удалит все видео, которые в нем находятся.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-2 mt-4">
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsDeletePlaylistModalOpen(false)}>
                            Отмена
                        </Button>
                        <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDeletePlaylist}>
                            Удалить список
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PlaylistDetailsPage;
