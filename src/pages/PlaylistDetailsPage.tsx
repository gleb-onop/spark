import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { storage } from '../utils/storage';
import type { Playlist, Video } from '../types';

const PlaylistDetailsPage = () => {
    const { playlistId } = useParams<{ playlistId: string }>();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [videos, setVideos] = useState<Video[]>([]);
    const [showMenu, setShowMenu] = useState(false);

    useEffect(() => {
        if (!playlistId) return;
        const allPlaylists = storage.getPlaylists();
        const current = allPlaylists.find(p => p.uuid === playlistId);
        if (current) {
            setPlaylist(current);
            const allVideos = storage.getVideos();
            setVideos(allVideos.filter(v => current.videoIds.includes(v.uuid)));
        } else {
            navigate('/playlists');
        }
    }, [playlistId, navigate]);

    const handleDeletePlaylist = () => {
        if (window.confirm('Удалить плейлист?')) {
            if (playlistId) {
                storage.deletePlaylist(playlistId);
                navigate('/playlists');
            }
        }
    };

    const handleDeleteVideo = (videoUuid: string) => {
        if (window.confirm('Удалить видео из плейлиста?')) {
            if (playlistId) {
                storage.deleteVideo(videoUuid, playlistId);
                // Refresh local state
                const allPlaylists = storage.getPlaylists();
                const current = allPlaylists.find(p => p.uuid === playlistId);
                if (current) {
                    setPlaylist(current);
                    const allVideos = storage.getVideos();
                    setVideos(allVideos.filter(v => current.videoIds.includes(v.uuid)));
                }
            }
        }
    };

    if (!playlist) return null;

    return (
        <div className="pb-20">
            <header className="px-5 py-4 flex items-center justify-between sticky top-0 bg-inherit z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/playlists')}
                        className="bg-transparent border-none text-inherit text-2xl p-0 cursor-pointer"
                    >
                        ←
                    </button>
                    <h2 className="m-0 text-xl font-bold">{playlist.name}</h2>
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="bg-transparent border-none text-inherit text-xl p-0 cursor-pointer"
                    >
                        ⋯
                    </button>
                    {showMenu && (
                        <div className="absolute top-full right-0 bg-bg-light dark:bg-bg-dark border border-gray-200 dark:border-white/10 rounded-lg py-2 min-w-[150px] shadow-lg z-[100]">
                            <button
                                onClick={handleDeletePlaylist}
                                className="w-full px-4 py-3 text-left bg-transparent border-none text-red-500 text-sm font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                Удалить плейлист
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="px-5">
                {videos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center text-inactive">
                        <span className="text-5xl mb-4">📁</span>
                        <p>Плейлист пуст</p>
                        <Link
                            to={`/add?playlistId=${playlistId}`}
                            className="mt-4 text-accent no-underline font-semibold"
                        >
                            Добавить первое видео
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 mt-3">
                        {videos.map(video => (
                            <div key={video.uuid} className="flex items-center gap-3 group">
                                <Link to={`/video/${video.uuid}`} className="flex flex-1 min-w-0 items-center gap-3 no-underline text-inherit">
                                    <img
                                        src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="w-[72px] h-12 rounded-md object-cover bg-black ring-1 ring-black/5 dark:ring-white/10"
                                    />
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <div className="text-sm font-medium truncate group-hover:text-accent transition-colors">
                                            {video.title}
                                        </div>
                                        {video.timeStart && (
                                            <span className="text-xs text-accent">✂</span>
                                        )}
                                    </div>
                                </Link>
                                <button
                                    onClick={() => handleDeleteVideo(video.uuid)}
                                    className="bg-transparent border-none text-inactive text-lg p-2 cursor-pointer hover:text-red-500 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[390px] px-5 z-10">
                <Link
                    to={`/add?playlistId=${playlistId}`}
                    className="flex items-center justify-center w-full h-14 bg-accent rounded-2xl text-white no-underline text-base font-bold shadow-[0_4px_12px_rgba(255,107,53,0.3)] hover:brightness-110 transition-all"
                >
                    Добавить видео
                </Link>
            </div>
        </div>
    );
};

export default PlaylistDetailsPage;
