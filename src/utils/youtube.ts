export async function fetchFragmentTitle(youtubeId: string): Promise<string | null> {
    try {
        const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
        const res = await fetch(url);
        if (!res.ok) return null;
        const data = await res.json();
        return data.title ?? null;
    } catch {
        return null;
    }
}

let isApiLoading = false;
let apiResolvers: (() => void)[] = [];

/**
 * Ensures that the YouTube IFrame API is loaded and returns a promise
 * that resolves when it's ready.
 */
export function ensureYouTubeIframeAPIReady(): Promise<void> {
    return new Promise((resolve) => {
        if (window.YT && window.YT.Player) {
            resolve();
            return;
        }

        apiResolvers.push(resolve);

        if (isApiLoading) return;
        isApiLoading = true;

        // Check if script is already added but not ready
        const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
        if (existingScript) {
            const check = setInterval(() => {
                if (window.YT && window.YT.Player) {
                    clearInterval(check);
                    apiResolvers.forEach(res => res());
                    apiResolvers = [];
                    isApiLoading = false;
                }
            }, 100);
            return;
        }

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            apiResolvers.forEach(res => res());
            apiResolvers = [];
            isApiLoading = false;
        };
    });
}
