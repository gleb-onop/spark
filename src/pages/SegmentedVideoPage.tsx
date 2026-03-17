import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MoreVertical, Trash2, FolderOpen, Plus, Play, Loader2 } from 'lucide-react';
import {
    DndContext,
    closestCenter,
    DragOverlay,
    defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Button } from "../components/ui/button";
import { PageHeader } from '@/components/PageHeader';
import { SegmentItem } from '@/components/SegmentItem';
import { SortableSegmentItem } from '@/components/SortableSegmentItem';
import { useSegmentedVideo } from '@/hooks/useSegmentedVideo';
import { useSegmentReorder } from '@/hooks/useSegmentReorder';
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

    const {
        localSegments,
        sensors,
        handleDragStart,
        handleDragEnd,
        activeSegment
    } = useSegmentReorder(segments, segmentedVideoId);

    const handleDeleteVideo = async () => {
        await deleteSegmentedVideo();
        navigate('/segmented-videos');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }
    if (!segmentedVideo) return <div className="p-8 text-center text-muted-foreground">Сегментированное видео не найдено</div>;

    return (
        <div className="bg-background pb-24 md:pb-8">
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
                                <Button variant="ghost" size="icon" className="rounded-full" aria-label="Дополнительно">
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

            {/* Desktop header (since PageHeader is md:hidden) */}
            <div className="hidden md:flex items-center justify-between px-8 pt-8 pb-4">
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <h1 className="text-4xl font-black tracking-tight truncate">{segmentedVideo.name}</h1>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <FolderOpen className="h-3 w-3 shrink-0" />
                        Сегментов: {localSegments.length}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {localSegments.length > 0 && (
                        <Button
                            asChild
                            className="rounded-xl shadow-lg shadow-brand/25 bg-brand text-white hover:bg-brand/90 px-5"
                        >
                            <Link to={`/segmented-videos/${segmentedVideo.uuid}/segments/${localSegments[0].uuid}`} className="flex items-center gap-2">
                                <Play className="h-5 w-5 fill-current" />
                                <span>Воспроизвести</span>
                            </Link>
                        </Button>
                    )}
                    <Button asChild className="rounded-xl bg-brand hover:bg-brand/90 text-white px-4">
                        <Link to={`/segmented-videos/${segmentedVideo.uuid}/segments/new`} className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            <span>Добавить</span>
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        className="rounded-xl text-red-500 border-red-500/20 hover:bg-red-500/10 px-4"
                        onClick={() => setModal({ type: 'deleteVideo' })}
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="ml-2">Удалить</span>
                    </Button>
                </div>
            </div>

            <main className="flex-1 p-5 md:px-8 md:py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Mobile-only title block */}
                <div className="flex items-center justify-between mb-8 gap-4 md:hidden">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="text-2xl font-black tracking-tight truncate">{segmentedVideo.name}</div>
                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest truncate">
                            <FolderOpen className="h-3 w-3 shrink-0" />
                            Сегментов: {localSegments.length}
                        </div>
                    </div>
                    {localSegments.length > 0 && (
                        <Button
                            asChild
                            size="icon"
                            className="rounded-full h-14 w-14 shadow-xl shadow-brand/25 bg-brand text-white hover:bg-brand/90 flex items-center justify-center"
                        >
                            <Link to={`/segmented-videos/${segmentedVideo.uuid}/segments/${localSegments[0].uuid}`}>
                                <Play className="h-7 w-7 fill-current ml-1" />
                            </Link>
                        </Button>
                    )}
                </div>

                {localSegments.length === 0 ? (
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
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={localSegments.map(s => s.uuid)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="flex flex-col gap-5">
                                {localSegments.map((segment) => (
                                    <SortableSegmentItem
                                        key={segment.uuid}
                                        segment={segment}
                                        segmentedVideoId={segmentedVideo.uuid}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                        <DragOverlay
                            dropAnimation={{
                                sideEffects: defaultDropAnimationSideEffects({
                                    styles: {
                                        active: {
                                            opacity: '0.4',
                                        },
                                    },
                                }),
                            }}
                        >
                            {activeSegment ? (
                                <div className="scale-95 opacity-50 shadow-2xl rounded-2xl overflow-hidden ring-2 ring-brand/50">
                                    <SegmentItem
                                        segment={activeSegment}
                                        segmentedVideoId={segmentedVideo.uuid}
                                    />
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
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
