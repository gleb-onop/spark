import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storage } from '../utils/storage';
import type { Video } from '../types';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Scissors } from "lucide-react";

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

const VideoPage = () => {
    const { playlistId, videoId } = useParams<{ playlistId: string; videoId: string }>();
    const navigate = useNavigate();
    const [video, setVideo] = useState<Video | null>(null);
    const [playlistVideos, setPlaylistVideos] = useState<Video[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLooping, setIsLooping] = useState(() => localStorage.getItem('spark_looping') === 'true');
    const playerRef = useRef<any>(null);
    const intervalRef = useRef<number | null>(null);
    const isLoopingRef = useRef(isLooping);

    // Persist looping state
    useEffect(() => {
        isLoopingRef.current = isLooping;
        localStorage.setItem('spark_looping', String(isLooping));
    }, [isLooping]);

    // Load current video and playlist context
    useEffect(() => {
        if (!videoId || !playlistId) return;

        const allVideos = storage.getVideos();
        const current = allVideos.find(v => v.uuid === videoId);
        if (!current) {
            navigate('/playlists');
            return;
        }
        setVideo(current);

        const allPlaylists = storage.getPlaylists();
        const playlist = allPlaylists.find(p => p.uuid === playlistId);
        if (playlist) {
            // Preserve playlist order
            const ordered = playlist.videoIds
                .map(id => allVideos.find(v => v.uuid === id))
                .filter(Boolean) as Video[];
            setPlaylistVideos(ordered);
        }
    }, [videoId, playlistId, navigate]);

    // Player setup
    useEffect(() => {
        if (!video) return;

        const parseTime = (str: string | null) => {
            if (!str) return 0;
            const [m, s] = str.split(':').map(Number);
            return m * 60 + s;
        };

        const startSec = parseTime(video.timeStart);
        const endSec = parseTime(video.timeEnd);
        const hasFragment = !!(video.timeStart && video.timeEnd);

        const stopInterval = () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        const goToNext = () => {
            stopInterval();
            // Persist mute state so next video respects user's choice
            if (playerRef.current) {
                sessionStorage.setItem('spark_muted', playerRef.current.isMuted() ? '1' : '0');
            }
            const currentIndex = playlistVideos.findIndex(v => v.uuid === video.uuid);
            const nextVideo = playlistVideos[currentIndex + 1];
            if (nextVideo) {
                navigate(`/video/${playlistId}/${nextVideo.uuid}`);
            } else if (isLoopingRef.current && playlistVideos.length > 0) {
                navigate(`/video/${playlistId}/${playlistVideos[0].uuid}`);
            } else {
                navigate(`/playlist/${playlistId}`);
            }
        };

        const loadVideo = () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }

            playerRef.current = new window.YT.Player('youtube-player', {
                videoId: video.youtubeId,
                playerVars: {
                    autoplay: 1,
                    controls: 1,
                    modestbranding: 1,
                    rel: 0,
                    showinfo: 0,
                    iv_load_policy: 3,
                    mute: 1,
                    start: startSec || 0,
                },
                events: {
                    onReady: (event: any) => {
                        // Restore mute preference from previous video
                        if (sessionStorage.getItem('spark_muted') === '0') {
                            event.target.unMute();
                        }
                        event.target.playVideo();
                    },
                    onStateChange: (event: any) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            goToNext();
                        }

                        if (hasFragment) {
                            if (event.data === window.YT.PlayerState.PLAYING) {
                                stopInterval();
                                intervalRef.current = window.setInterval(() => {
                                    const currentTime = event.target.getCurrentTime();
                                    if (currentTime >= endSec - 0.15) {
                                        goToNext();
                                    }
                                }, 100);
                            } else {
                                stopInterval();
                            }
                        }
                    }
                }
            });
        };

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
            window.onYouTubeIframeAPIReady = loadVideo;
        } else {
            loadVideo();
        }

        return () => {
            stopInterval();
            if (playerRef.current) playerRef.current.destroy();
        };
    }, [video, playlistVideos, playlistId, navigate]);

    if (!video) return null;

    return (
        <div className="bg-background min-h-screen">
            <header className="px-5 py-3 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-md z-10 border-b border-border">
                <button
                    onClick={() => navigate(`/playlist/${playlistId}`)}
                    className="bg-transparent border-none text-inherit hover:bg-muted p-2 rounded-full transition-colors shrink-0"
                >
                    <ChevronLeft className="h-6 w-6" />
                </button>
                <h2 className="m-0 text-base font-semibold truncate">
                    {video.title}
                </h2>
            </header>

            <div className="w-full relative bg-black" style={{
                paddingTop: video.isVertical ? '100%' : '56.25%',
            }}>
                <div id="youtube-player" className="absolute top-0 left-0 w-full h-full" />
            </div>

            <div className="p-5">
                <h1 className="text-xl m-0 mb-3 font-bold">{video.title}</h1>

                {video.timeStart && video.timeEnd && (
                    <div className="inline-flex items-center gap-1.5 bg-accent px-3 py-1.5 rounded-full text-xs font-bold text-white mb-4 shadow-sm">
                        <Scissors className="h-3.5 w-3.5" />
                        <span>{video.timeStart} – {video.timeEnd}</span>
                    </div>
                )}

                <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-muted dark:bg-muted/50 border border-border">
                    <div className="flex-1 mr-4">
                        <p className={`text-sm leading-relaxed m-0 text-foreground/90 ${isExpanded ? 'block' : 'line-clamp-3 overflow-hidden'}`}>
                            {video.description || 'Нет описания'}
                        </p>
                        {video.description && video.description.length > 110 && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="bg-transparent border-none text-accent p-0 pt-2 text-sm font-semibold cursor-pointer block"
                            >
                                {isExpanded ? 'скрыть' : 'ещё'}
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between mb-8 px-1">
                    <div className="flex flex-col gap-0.5">
                        <Label htmlFor="loop-toggle" className="text-sm font-bold leading-none cursor-pointer">
                            Зациклить плейлист
                        </Label>
                        <span className="text-xs text-muted-foreground">Повторять текущий список</span>
                    </div>
                    <Switch
                        id="loop-toggle"
                        checked={isLooping}
                        onCheckedChange={setIsLooping}
                        className="data-[state=checked]:bg-accent"
                    />
                </div>

                <Link
                    to={`/edit/${video.uuid}`}
                    className="flex items-center justify-center w-full h-12 border border-border rounded-xl text-inherit no-underline text-sm font-semibold hover:bg-muted transition-colors shadow-sm"
                >
                    Редактировать
                </Link>
            </div>
        </div>
    );
};

export default VideoPage;
