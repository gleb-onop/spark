import { useState, useEffect } from 'react';
import { getYouTubeOEmbed, type YTMetadata } from '@/utils/youtube';

export const useYouTubeOEmbed = (videoId: string) => {
    const [metadata, setMetadata] = useState<YTMetadata | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!videoId) {
            setMetadata(null);
            return;
        }

        let isMounted = true;
        setIsLoading(true);
        setError(null);

        getYouTubeOEmbed(videoId)
            .then((data) => {
                if (isMounted) {
                    setMetadata(data);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    setError(err instanceof Error ? err : new Error('Unknown error'));
                }
            })
            .finally(() => {
                if (isMounted) {
                    setIsLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [videoId]);

    const thumbnailUrl = metadata?.thumbnail_url || (videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '');

    return { metadata, isLoading, error, thumbnailUrl };
};
