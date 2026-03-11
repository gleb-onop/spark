import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MoreVertical, Trash2, FolderOpen, Plus, Play } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import { PageHeader } from '@/components/PageHeader';
import { SegmentItem } from '@/components/SegmentItem';
import { useSegmentedVideo } from '@/hooks/useSegmentedVideo';
import { ConfirmDialog } from '../components/ConfirmDialog';

type ModalState =
    | { type: 'deleteVideo' }
    | null;

const SegmentedVideoPage = () => {
    const { segmentedVideoId } = useParams<{ segmentedVideoId: string }>();
    const navigate = useNavigate();

    const [modal, setModal] = useState<ModalState>(null);

    const {
        segmentedVideo,
        segments,
        isLoading,
        deleteSegmentedVideo
    } = useSegmentedVideo(segmentedVideoId);

    const handleDeleteVideo = async () => {
        await deleteSegmentedVideo();
        navigate('/segmented-videos');
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
                            <Link to={`/segmented-videos/${segmentedVideo.uuid}/segments/new`}>
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
                                    onClick={() => setModal({ type: 'deleteVideo' })}
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
                            Сегментов: {segments.length}
                        </div>
                    </div>
                    {segments.length > 0 && (
                        <Button
                            asChild
                            size="icon"
                            className="rounded-full h-14 w-14 shadow-xl shadow-brand/25 bg-brand text-white hover:bg-brand/90 flex items-center justify-center"
                        >
                            <Link to={`/segmented-videos/${segmentedVideo.uuid}/segments/${segments[0].uuid}`}>
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
                            <Link to={`/segmented-videos/${segmentedVideo.uuid}/segments/new`}>
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
                            />
                        ))}
                    </div>
                )}
            </main>


            <ConfirmDialog
                open={modal?.type === 'deleteVideo'}
                onOpenChange={(open) => !open && setModal(null)}
                title="Удалить сегментированное видео?"
                description={`Вы уверены, что хотите удалить сегментированное видео "${segmentedVideo.name}"? Это также удалит все сегменты, которые в нем находятся.`}
                primaryAction={{
                    label: "Удалить",
                    variant: "destructive",
                    onClick: handleDeleteVideo
                }}
                secondaryAction={{
                    label: "Отмена",
                    onClick: () => setModal(null)
                }}
            />
        </div>
    );
};

export default SegmentedVideoPage;
