import { Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoThumbnailProps {
    youtubeId: string;
    title: string;
    timeStart?: string | null;
    timeEnd?: string | null;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const VideoThumbnail = ({
    youtubeId,
    title,
    timeStart,
    timeEnd,
    className,
    size = 'md'
}: VideoThumbnailProps) => {
    const isShowingFragment = !!timeStart;

    const sizeClasses = {
        sm: "w-[72px] h-12 rounded-lg",
        md: "w-full aspect-video rounded-xl",
        lg: "w-full aspect-video rounded-2xl",
    };

    return (
        <div className={cn("relative overflow-hidden bg-black ring-1 ring-black/5 dark:ring-white/10", sizeClasses[size], className)}>
            <img
                src={`https://img.youtube.com/vi/${youtubeId}/${size === 'sm' ? 'mqdefault' : 'hqdefault'}.jpg`}
                alt={title}
                className="absolute inset-0 w-full h-full object-cover"
            />
            {isShowingFragment && size !== 'sm' && (
                <div className="absolute top-2 left-2 inline-flex items-center gap-1.5 bg-accent/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-bold text-white shadow-sm ring-1 ring-white/20">
                    <Scissors className="h-3 w-3" />
                    <span>{timeStart} {timeEnd ? `– ${timeEnd}` : ''}</span>
                </div>
            )}
        </div>
    );
};
