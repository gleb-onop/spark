import { useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Info, Edit2, Scissors } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { usePlaylist } from '@/hooks/usePlaylist';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';

const FragmentPage = () => {
    const { playlistId, fragmentId } = useParams<{ playlistId: string; fragmentId: string }>();
    const navigate = useNavigate();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLooping, setIsLooping] = useState(() => localStorage.getItem('spark_looping') === 'true');

    const { playlist, fragments } = usePlaylist(playlistId);
    const fragment = fragments.find(f => f.uuid === fragmentId);

    const onComplete = useCallback(() => {
        if (!playlist || !fragment) return;
        const currentIndex = playlist.fragmentIds.indexOf(fragment.uuid);
        if (currentIndex < playlist.fragmentIds.length - 1) {
            navigate(`/fragment/${playlistId}/${playlist.fragmentIds[currentIndex + 1]}`);
        } else if (isLooping) {
            navigate(`/fragment/${playlistId}/${playlist.fragmentIds[0]}`);
        } else {
            navigate(`/playlist/${playlistId}`);
        }
    }, [playlist, fragment, playlistId, navigate, isLooping]);


    useYouTubePlayer({
        youtubeId: fragment?.youtubeId || '',
        timeStart: fragment?.timeStart || null,
        timeEnd: fragment?.timeEnd || null,
        onComplete,
        onFragmentEnded: onComplete,
    });

    const toggleLoop = (checked: boolean) => {
        setIsLooping(checked);
        localStorage.setItem('spark_looping', String(checked));
    };

    if (!fragment || !playlist) return null;

    return (
        <div className="flex flex-col min-h-screen bg-background pb-24">
            <PageHeader
                title={playlist.name}
                backPath={`/playlist/${playlistId}`}
                actions={
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link to={`/edit/${fragment.uuid}/${playlistId}`}>
                            <Edit2 className="h-4 w-4" />
                        </Link>
                    </Button>
                }
            />

            <div className="w-full bg-black aspect-video sticky top-[61px] z-20 shadow-xl overflow-hidden" style={{
                paddingTop: fragment.isVertical ? '100%' : '56.25%',
            }}>
                <div id="youtube-player" className="absolute top-0 left-0 w-full h-full" />
            </div>

            <main className="p-5 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section>
                    <h1 className="text-2xl font-black m-0 mb-2 tracking-tight leading-tight">{fragment.title}</h1>

                    {fragment.timeStart && (
                        <div className="flex items-center gap-2 text-sm text-brand font-black mb-4 bg-brand/10 w-fit px-3 py-1 rounded-xl border border-brand/20 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                            <Scissors className="h-4 w-4" />
                            <span>{fragment.timeStart} {fragment.timeEnd ? `– ${fragment.timeEnd}` : ''}</span>
                        </div>
                    )}

                    <div className="bg-muted/50 dark:bg-muted/20 border border-border p-4 rounded-2xl overflow-hidden relative">
                        <div className="min-w-0">
                            <p className={`text-sm leading-relaxed m-0 text-foreground/80 break-words whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}>
                                {fragment.description || 'Нет описания'}
                            </p>
                            {fragment.description && fragment.description.length > 110 && (
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-accent font-bold text-xs mt-3 uppercase tracking-wider hover:underline"
                                >
                                    {isExpanded ? 'Свернуть' : 'Развернуть'}
                                </button>
                            )}
                        </div>
                    </div>
                </section>

                <section className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="p-2 bg-accent/10 rounded-xl shrink-0">
                                <Info className="h-5 w-5 text-accent" />
                            </div>
                            <div className="flex flex-col min-w-0">
                                <Label htmlFor="loop-toggle" className="text-sm font-bold cursor-pointer">
                                    Зациклить плейлист
                                </Label>
                                <span className="text-[10px] text-muted-foreground truncate">Авто-повтор текущего списка</span>
                            </div>
                        </div>
                        <Switch
                            id="loop-toggle"
                            checked={isLooping}
                            onCheckedChange={toggleLoop}
                        />
                    </div>
                </section>
            </main>
        </div>
    );
};

export default FragmentPage;
