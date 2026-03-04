import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { storage } from '../utils/storage';
import { Check, Loader2, Trash2 } from 'lucide-react';
import { parseTime } from '../utils/time';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/PageHeader';
import { FragmentThumbnail } from '@/components/FragmentThumbnail';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

const EditPage = () => {
    const { playlistId, fragmentId } = useParams<{ playlistId: string; fragmentId: string }>();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [useRange, setUseRange] = useState(false);
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');
    const [youtubeId, setYoutubeId] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [error, setError] = useState('');

    useEffect(() => {
        if (!fragmentId) return;

        const fragment = storage.getFragment(fragmentId);
        if (fragment) {
            setTitle(fragment.title);
            setDescription(fragment.description || '');
            setYoutubeId(fragment.youtubeId);
            if (fragment.timeStart || fragment.timeEnd) {
                setUseRange(true);
                setTimeStart(fragment.timeStart || '');
                setTimeEnd(fragment.timeEnd || '');
            }
        }
        setIsLoading(false);
    }, [fragmentId]);

    const handleSave = () => {
        if (!fragmentId) return;
        setError('');

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

        storage.updateFragment(fragmentId, {
            title,
            description,
            timeStart: useRange ? timeStart : null,
            timeEnd: useRange ? timeEnd : null,
        });

        navigate(playlistId ? `/playlist/${playlistId}` : '/playlists');
    };

    const confirmDelete = () => {
        if (!fragmentId) return;
        storage.deleteFragment(fragmentId);
        navigate(playlistId ? `/playlist/${playlistId}` : '/playlists');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            <PageHeader
                title="Редактировать"
                backPath={-1}
                actions={
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full"
                    >
                        <Trash2 className="h-5 w-5" />
                    </Button>
                }
            />

            <main className="p-5 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="flex flex-col gap-6">
                    {youtubeId && (
                        <div className="animate-in zoom-in-95 duration-300">
                            <FragmentThumbnail
                                youtubeId={youtubeId}
                                title={title}
                                className="shadow-2xl ring-4 ring-black/5 dark:ring-white/5"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-sm font-bold ml-1">Название фрагмента</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Заголовок..."
                            className="h-14 rounded-2xl bg-muted/30 border-none shadow-inner"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-bold ml-1">Описание (необязательно)</Label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ваши заметки..."
                            className="w-full min-h-[140px] p-4 bg-muted/30 border-none rounded-2xl outline-none text-foreground font-medium shadow-inner transition-all focus:ring-2 focus:ring-accent/20 resize-none"
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
                    className="h-16 rounded-2xl shadow-xl shadow-accent/30 font-bold text-lg transition-transform active:scale-95"
                >
                    <Check className="mr-2 h-6 w-6" />
                    Сохранить изменения
                </Button>
            </main>

            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="rounded-3xl max-w-[90vw]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black">Удалить фрагмент?</DialogTitle>
                        <DialogDescription className="text-base">
                            Этот фрагмент будет навсегда удален из всех ваших плейлистов. Это действие нельзя отменить.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col gap-3 mt-4 sm:flex-col">
                        <Button
                            variant="destructive"
                            className="h-14 rounded-2xl font-bold text-base"
                            onClick={confirmDelete}
                        >
                            Да, удалить фрагмент
                        </Button>
                        <Button
                            variant="ghost"
                            className="h-14 rounded-2xl font-bold text-base"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Отмена
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default EditPage;
