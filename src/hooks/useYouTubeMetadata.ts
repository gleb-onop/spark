import { useState, useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { parseYouTubeTimestamp } from '@/utils/youtube';

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

                let newId = '';
                let t: string | null = null;

                try {
                    const urlObj = new URL(currentUrl.startsWith('http') ? currentUrl : `https://${currentUrl}`);

                    if (urlObj.hostname.includes('youtu.be')) {
                        newId = urlObj.pathname.slice(1);
                    } else if (urlObj.searchParams.has('v')) {
                        newId = urlObj.searchParams.get('v') || '';
                    } else {
                        const pathParts = urlObj.pathname.split('/').filter(Boolean);
                        newId = pathParts[pathParts.length - 1] || '';
                    }

                    t = urlObj.searchParams.get('t') || urlObj.searchParams.get('start');
                } catch (e) {
                    // Ignore, it might be just an 11-char ID
                }

                // Fallback for plain ID if it's exactly 11 chars
                if (!newId && currentUrl.trim().length === 11) {
                    newId = currentUrl.trim();
                }

                if (newId) {
                    setYoutubeId(newId);
                    setUrlError('');
                    setInitialTimestamp(t ? parseYouTubeTimestamp(t) : null);
                } else {
                    setYoutubeId('');
                    setInitialTimestamp(null);
                    setUrlError('Не удалось распознать ссылку');
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
