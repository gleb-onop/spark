import { Link } from 'react-router-dom';
import { Scissors, X } from 'lucide-react';
import { FragmentThumbnail } from './FragmentThumbnail';
import type { Fragment } from '../types';

interface FragmentItemProps {
    fragment: Fragment;
    playlistId: string;
    onDelete?: (uuid: string) => void;
}

export const FragmentItem = ({ fragment, playlistId, onDelete }: FragmentItemProps) => {
    return (
        <div className="flex items-center gap-3 group">
            <Link
                to={`/fragment/${playlistId}/${fragment.uuid}`}
                className="flex flex-1 min-w-0 items-center gap-3 no-underline text-inherit"
            >
                <FragmentThumbnail
                    youtubeId={fragment.youtubeId}
                    title={fragment.title}
                    size="sm"
                    className="shrink-0"
                />
                <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="text-sm font-semibold truncate group-hover:text-accent transition-colors">
                        {fragment.title}
                    </div>
                    {fragment.timeStart && (
                        <div className="flex items-center gap-1.5 text-xs text-brand font-black mt-1.5 bg-brand/10 w-fit px-2 py-0.5 rounded-lg border border-brand/20">
                            <Scissors className="h-3 w-3" />
                            <span>{fragment.timeStart} {fragment.timeEnd ? `– ${fragment.timeEnd}` : ''}</span>
                        </div>
                    )}
                </div>
            </Link>
            {onDelete && (
                <button
                    onClick={() => onDelete(fragment.uuid)}
                    className="bg-transparent border-none text-muted-foreground hover:bg-red-500/10 hover:text-red-500 p-2 rounded-full transition-colors cursor-pointer shrink-0"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};
