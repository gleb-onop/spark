export async function fetchVideoTitle(youtubeId: string): Promise<string | null> {
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
