import { Link } from 'react-router-dom';
import { Scissors, X } from 'lucide-react';
import { VideoThumbnail } from './VideoThumbnail';
import type { Video } from '../types';

interface VideoItemProps {
    video: Video;
    playlistId: string;
    onDelete?: (uuid: string) => void;
}

export const VideoItem = ({ video, playlistId, onDelete }: VideoItemProps) => {
    return (
        <div className="flex items-center gap-3 group">
            <Link
                to={`/video/${playlistId}/${video.uuid}`}
                className="flex flex-1 min-w-0 items-center gap-3 no-underline text-inherit"
            >
                <VideoThumbnail
                    youtubeId={video.youtubeId}
                    title={video.title}
                    size="sm"
                    className="shrink-0"
                />
                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
                        {video.title}
                    </div>
                    {video.timeStart && (
                        <div className="flex items-center gap-1.5 text-xs text-brand font-black mt-1.5 bg-brand/10 w-fit px-2 py-0.5 rounded-lg border border-brand/20">
                            <Scissors className="h-3 w-3" />
                            <span>{video.timeStart} {video.timeEnd ? `– ${video.timeEnd}` : ''}</span>
                        </div>
                    )}
                </div>
            </Link>
            {onDelete && (
                <button
                    onClick={() => onDelete(video.uuid)}
                    className="bg-transparent border-none text-muted-foreground hover:bg-red-500/10 hover:text-red-500 p-2 rounded-full transition-colors cursor-pointer shrink-0"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};
