import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storage } from '../utils/storage';
import type { Video } from '../types';

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

const VideoPage = () => {
    const { videoId } = useParams<{ videoId: string }>();
    const navigate = useNavigate();
    const [video, setVideo] = useState<Video | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const playerRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const loopIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (!videoId) return;
        const allVideos = storage.getVideos();
        const current = allVideos.find(v => v.uuid === videoId);
        if (current) {
            setVideo(current);
        } else {
            navigate('/playlists');
        }
    }, [videoId, navigate]);

    useEffect(() => {
        if (!video) return;

        const loadVideo = () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }

            const parseTime = (str: string | null) => {
                if (!str) return 0;
                const [m, s] = str.split(':').map(Number);
                return m * 60 + s;
            };

            const timeStart = parseTime(video.timeStart);

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
                    start: timeStart || 0,
                },
                events: {
                    onReady: (event: any) => {
                        event.target.playVideo();
                        if (video.timeStart && video.timeEnd) {
                            const startSec = parseTime(video.timeStart);
                            const endSec = parseTime(video.timeEnd);

                            if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);

                            loopIntervalRef.current = window.setInterval(() => {
                                const currentTime = event.target.getCurrentTime();
                                if (currentTime >= endSec - 0.15) {
                                    event.target.seekTo(startSec, true);
                                }
                            }, 200);
                        }
                    },
                    onStateChange: (event: any) => {
                        // Handle loop if no fragment is set (standard YT loop)
                        if (event.data === window.YT.PlayerState.ENDED && !video.timeStart && !video.timeEnd) {
                            event.target.playVideo();
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
            if (loopIntervalRef.current) clearInterval(loopIntervalRef.current);
            if (playerRef.current) playerRef.current.destroy();
        };
    }, [video]);

    if (!video) return null;

    return (
        <div className="bg-inherit min-h-screen">
            <header className="px-5 py-4 flex items-center gap-4 sticky top-0 bg-inherit z-10 border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-transparent border-none text-inherit text-2xl p-0 cursor-pointer"
                >
                    ←
                </button>
                <h2 className="m-0 text-base font-semibold truncate">
                    {video.title}
                </h2>
            </header>

            <div ref={containerRef} className="w-full relative bg-black" style={{
                paddingTop: video.isVertical ? '100%' : '56.25%',
            }}>
                <div id="youtube-player" className="absolute top-0 left-0 w-full h-full" />
            </div>

            <div className="p-5">
                <h1 className="text-xl m-0 mb-3 font-bold">{video.title}</h1>

                {video.timeStart && video.timeEnd && (
                    <div className="inline-flex items-center gap-2 bg-accent px-3 py-1 rounded-full text-xs font-bold text-white mb-4">
                        ✂ {video.timeStart} – {video.timeEnd}
                    </div>
                )}

                <div className="mb-6 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                    <p className={`text-sm leading-relaxed m-0 text-gray-700 dark:text-gray-300 ${isExpanded ? 'block' : 'line-clamp-3 overflow-hidden'}`}>
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

                <Link
                    to={`/edit/${video.uuid}`}
                    className="flex items-center justify-center w-full h-12 border border-gray-300 dark:border-white/20 rounded-xl text-inherit no-underline text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                    Редактировать
                </Link>
            </div>
        </div>
    );
};

export default VideoPage;
