export interface Playlist {
    uuid: string;
    name: string;
    createdAt: number;
    videoIds: string[];
}

export interface Video {
    uuid: string;
    youtubeId: string;
    title: string;
    description: string;
    isVertical: boolean;
    timeStart: string | null;
    timeEnd: string | null;
    createdAt: number;
}
