import { Loader2 } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface YouTubeInputSectionProps {
    url?: string;
    setUrl?: (url: string) => void;
    urlError?: string;
    youtubeId: string;
    title: string;
    setTitle: (title: string) => void;
    isFetchingTitle?: boolean;
    showUrlInput?: boolean;
}

export const YouTubeInputSection = ({
    url = '',
    setUrl = () => { },
    urlError = '',
    youtubeId,
    title,
    setTitle,
    isFetchingTitle = false,
    showUrlInput = true,
}: YouTubeInputSectionProps) => {
    return (
        <div className="space-y-6">
            {showUrlInput && (
                <div className="space-y-2">
                    <Label htmlFor="segment-url" className="text-sm font-bold ml-1">Ссылка на YouTube</Label>
                    <Input
                        id="segment-url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="Вставьте ссылку..."
                        className={`h-14 rounded-2xl bg-muted/30 border-none shadow-inner transition-all ${urlError ? 'ring-2 ring-red-500/50' : ''}`}
                    />
                    {urlError && <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest ml-1">{urlError}</p>}
                </div>
            )}

            {youtubeId && (
                <div className="animate-in zoom-in-95 duration-300">
                    <div className="w-full aspect-video relative rounded-2xl overflow-hidden shadow-2xl ring-4 ring-black/5 dark:ring-white/5">
                        <img
                            src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
                            alt="Превью"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                </div>
            )}

            {youtubeId && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                    <Label htmlFor="segment-title" className="text-sm font-bold ml-1">Название видео</Label>
                    <div className="relative">
                        <Input
                            id="segment-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={isFetchingTitle ? 'Загрузка...' : 'Заголовок...'}
                            className="h-14 rounded-2xl bg-muted/30 border-none shadow-inner pr-12"
                        />
                        {isFetchingTitle && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
