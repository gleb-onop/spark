declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
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

        const timeout = setTimeout(() => {
            if (isApiLoading) {
                console.warn('YouTube IFrame API load timeout - resolving anyway');
                apiResolvers.forEach(res => res());
                apiResolvers = [];
                isApiLoading = false;
            }
        }, 5000);

        // Check if script is already added but not ready
        const existingScript = document.querySelector('script[src*="youtube.com/iframe_api"]');
        if (existingScript) {
            const check = setInterval(() => {
                if (window.YT && window.YT.Player) {
                    clearInterval(check);
                    clearTimeout(timeout);
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
            clearTimeout(timeout);
            apiResolvers.forEach(res => res());
            apiResolvers = [];
            isApiLoading = false;
        };
    });
}
