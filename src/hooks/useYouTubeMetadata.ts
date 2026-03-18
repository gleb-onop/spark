import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { extractYouTubeMetadata } from '@/utils/youtube';

const DEBOUNCE_DELAY_MS = 500;

export const useYouTubeMetadata = (url: string) => {
    const [youtubeId, setYoutubeId] = useState('');
    const [initialTimestamp, setInitialTimestamp] = useState<number | null>(null);
    const [urlError, setUrlError] = useState('');

    const parseUrl = useMemo(
        () =>
            debounce((currentUrl: string) => {
                if (!currentUrl) {
                    setYoutubeId('');
                    setInitialTimestamp(null);
                    setUrlError('');
                    return;
                }

                const { videoId: newId, initialTimestamp: newTimestamp, error } = extractYouTubeMetadata(currentUrl);

                if (newId) {
                    setYoutubeId(newId);
                    setInitialTimestamp(newTimestamp);
                    setUrlError('');
                } else {
                    setYoutubeId('');
                    setInitialTimestamp(null);
                    setUrlError(error || 'Не удалось распознать ссылку');
                }
            }, DEBOUNCE_DELAY_MS),
        []
    );

    useEffect(() => {
        parseUrl(url);
        return () => parseUrl.cancel();
    }, [url, parseUrl]);

    return {
        youtubeId,
        initialTimestamp,
        urlError
    };
};
