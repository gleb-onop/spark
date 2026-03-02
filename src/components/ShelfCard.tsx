import { Link } from 'react-router-dom';
import type { Video } from '../types';

interface ShelfCardProps {
    video?: Video;
    playlistId: string;
    isPlaceholder?: boolean;
}

const ShelfCard = ({ video, playlistId, isPlaceholder }: ShelfCardProps) => {
    if (isPlaceholder) {
        return (
            <Link
                to={`/add?playlistId=${playlistId}`}
                className="min-w-[110px] w-[110px] h-[100px] flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-white/20 rounded-lg no-underline text-inactive gap-1 snap-start hover:border-accent hover:text-accent transition-all"
            >
                <span className="text-2xl">+</span>
                <span className="text-[10px] font-semibold">Добавить</span>
            </Link>
        );
    }

    if (!video) return null;

    return (
        <Link
            to={`/video/${video.uuid}`}
            className="min-w-[110px] w-[110px] flex flex-col no-underline text-inherit snap-start group"
        >
            <div className="w-full aspect-video relative rounded-lg overflow-hidden bg-black mb-2 ring-1 ring-black/5 dark:ring-white/10 group-hover:ring-accent/50 transition-all">
                <img
                    src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xl">▶</span>
                </div>
                {(video.timeStart || video.timeEnd) && (
                    <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-sm text-white px-1 rounded text-[10px] font-bold">
                        ✂
                    </div>
                )}
            </div>
            <div className="text-[11px] leading-snug line-clamp-2 overflow-hidden font-medium group-hover:text-accent transition-colors">
                {video.title}
            </div>
        </Link>
    );
};

export default ShelfCard;
