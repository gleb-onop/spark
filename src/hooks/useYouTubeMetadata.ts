import { useState, useEffect } from 'react';
import { fetchSegmentTitle } from '../utils/youtube';

export const useYouTubeMetadata = (url: string) => {
    const [youtubeId, setYoutubeId] = useState('');
    const [title, setTitle] = useState('');
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);
    const [urlError, setUrlError] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!url) {
                setYoutubeId('');
                setTitle('');
                setUrlError('');
                return;
            }

            // Robust regex covering watch, shorts, embed, live and youtu.be
            const match = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([a-zA-Z0-9_-]{11})/);
            let newId = match ? match[1] : '';

            // Fallback for plain ID if it's exactly 11 chars
            if (!newId && url.trim().length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(url.trim())) {
                newId = url.trim();
            }

            if (newId) {
                setYoutubeId(newId);
                setUrlError('');
                setIsFetchingTitle(true);
                fetchSegmentTitle(newId).then((fetchedTitle: string | null) => {
                    if (fetchedTitle) setTitle(fetchedTitle);
                    setIsFetchingTitle(false);
                });
            } else {
                setYoutubeId('');
                setTitle('');
                setUrlError('Не удалось распознать ссылку');
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [url]);

    return {
        youtubeId,
        title,
        setTitle,
        isFetchingTitle,
        urlError
    };
};
