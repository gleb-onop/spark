import { Link } from 'react-router-dom';
import type { Fragment } from '../types';
import { Plus } from 'lucide-react';
import { FragmentThumbnail } from './FragmentThumbnail';

interface ShelfCardProps {
    fragment?: Fragment;
    playlistId: string;
    isPlaceholder?: boolean;
}

const ShelfCard = ({ fragment, playlistId, isPlaceholder }: ShelfCardProps) => {
    if (isPlaceholder) {
        return (
            <Link
                to={`/add?playlistId=${playlistId}`}
                className="min-w-[120px] w-32 aspect-[3/4] flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl no-underline text-muted-foreground gap-2 snap-start hover:border-accent hover:text-accent transition-all shadow-sm bg-muted/20"
            >
                <div className="p-3 bg-background rounded-full shadow-sm">
                    <Plus className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold">Добавить</span>
            </Link>
        );
    }

    if (!fragment) return null;

    return (
        <Link
            to={`/fragment/${playlistId}/${fragment.uuid}`}
            className="min-w-[140px] w-36 flex flex-col no-underline text-inherit snap-start group"
        >
            <FragmentThumbnail
                youtubeId={fragment.youtubeId}
                title={fragment.title}
                className="mb-2 group-hover:ring-accent/50 group-hover:scale-[1.02] transition-all duration-300 shadow-md"
            />
            <div className="text-xs leading-snug line-clamp-2 overflow-hidden font-semibold group-hover:text-accent transition-colors px-1">
                {fragment.title}
            </div>
        </Link>
    );
};

export default ShelfCard;
