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
import { api } from '../services/api';
import { PageHeader } from '@/components/PageHeader';
import { SegmentItem } from '@/components/SegmentItem';
import { useSegmentedVideo } from '@/hooks/useSegmentedVideo';

const SegmentedVideoPage = () => {
    const { segmentedVideoId } = useParams<{ segmentedVideoId: string }>();
    const navigate = useNavigate();
    const [segmentToDelete, setSegmentToDelete] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteSegmentedVideoModalOpen, setIsDeleteSegmentedVideoModalOpen] = useState(false);
    const [newName, setNewName] = useState('');

    const { segmentedVideo, segments, isLoading, deleteSegment, renameSegmentedVideo } = useSegmentedVideo(segmentedVideoId);

    const handleRename = () => {
        if (newName.trim()) {
            renameSegmentedVideo(newName);
            setIsEditModalOpen(false);
        }
    };

    const handleDeleteSegmentedVideo = async () => {
        if (!segmentedVideoId) return;
        try {
            await api.deleteSegmentedVideo(segmentedVideoId);
            navigate('/segmented-videos');
        } catch (e) {
            console.error('Error deleting segmented video:', e);
        }
    };

    if (isLoading) return null;
    if (!segmentedVideo) return <div className="p-8 text-center text-muted-foreground">Сегментированное видео не найдено</div>;

    return (
        <div className="flex flex-col min-h-screen bg-background pb-20">
            <PageHeader
                title={segmentedVideo.name}
                backPath="/segmented-videos"
                actions={
                    <div className="flex items-center gap-2">
                        <Button size="icon" asChild className="rounded-full shadow-lg shadow-brand/20 bg-brand hover:bg-brand/90 text-white">
                            <Link to={`/add?segmentedVideoId=${segmentedVideo.uuid}`}>
                                <Plus className="h-5 w-5" />
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full">
                                    <MoreVertical className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-1">
                                <DropdownMenuItem
                                    onClick={() => {
                                        setNewName(segmentedVideo.name);
                                        setIsEditModalOpen(true);
                                    }}
                                    className="rounded-lg gap-2"
                                >
                                    <Edit2 className="h-4 w-4" />
                                    <span>Переименовать</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setIsDeleteSegmentedVideoModalOpen(true)}
                                    className="rounded-lg gap-2 text-red-500 focus:text-red-500"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Удалить сегментированное видео</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                }
            />

            <main className="flex-1 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex flex-col gap-1">
                        <div className="text-3xl font-black tracking-tight">{segmentedVideo.name}</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                            <FolderOpen className="h-3 w-3" />
                            {segments.length} сегментов
                        </div>
                    </div>
                    {segments.length > 0 && (
                        <Button
                            asChild
                            size="icon"
                            className="rounded-full h-14 w-14 shadow-xl shadow-brand/25 bg-brand text-white hover:bg-brand/90 flex items-center justify-center"
                        >
                            <Link to={`/segment/${segmentedVideo.uuid}/${segments[0].uuid}`}>
                                <Play className="h-7 w-7 fill-current ml-1" />
                            </Link>
                        </Button>
                    )}
                </div>

                {segments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 border border-border rounded-2xl">
                        <FolderOpen className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="font-bold mb-1">Сегментированное видео пусто</h3>
                        <p className="text-sm text-muted-foreground mb-4">Начните изучение, добавив первый сегмент</p>
                        <Button asChild size="sm" className="rounded-xl bg-brand text-white font-semibold">
                            <Link to={`/add?segmentedVideoId=${segmentedVideo.uuid}`}>
                                Добавить первый сегмент
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5">
                        {segments.map((segment) => (
                            <SegmentItem
                                key={segment.uuid}
                                segment={segment}
                                segmentedVideoId={segmentedVideo.uuid}
                                onDelete={(uuid) => setSegmentToDelete(uuid)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* Modals */}
            <Dialog open={!!segmentToDelete} onOpenChange={(open) => !open && setSegmentToDelete(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Удалить сегмент?</DialogTitle>
                        <DialogDescription>
                            Это действие нельзя будет отменить. Сегмент будет удален из текущего сегментированного видео.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-2 mt-4">
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setSegmentToDelete(null)}>
                            Отмена
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1 rounded-xl"
                            onClick={() => {
                                if (segmentToDelete) {
                                    deleteSegment(segmentToDelete);
                                    setSegmentToDelete(null);
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
                            Введите новое название для сегментированного видео.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Название сегментированного видео"
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

            <Dialog open={isDeleteSegmentedVideoModalOpen} onOpenChange={setIsDeleteSegmentedVideoModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Удалить сегментированное видео?</DialogTitle>
                        <DialogDescription>
                            Вы уверены, что хотите удалить сегментированное видео "{segmentedVideo.name}"? Это также удалит все сегменты, которые в нем находятся.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-row gap-2 mt-4">
                        <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setIsDeleteSegmentedVideoModalOpen(false)}>
                            Отмена
                        </Button>
                        <Button variant="destructive" className="flex-1 rounded-xl" onClick={handleDeleteSegmentedVideo}>
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SegmentedVideoPage;
