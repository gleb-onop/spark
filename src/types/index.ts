export type Uuid = string;
export type Timestamp = number;

export interface Video {
    uuid: Uuid;
    youtubeId: string;
    title: string;
    description: string;
    duration: number;
    isEmbeddable: boolean;
    isVertical: boolean;
    createdAt: Timestamp;
}

export interface Segment {
    uuid: Uuid;
    description: string;
    timeStart: string | null;
    timeEnd: string | null;
    video: Video;
    createdAt: Timestamp;
}

export interface SegmentedVideo {
    uuid: Uuid;
    name: string;
    createdAt: Timestamp;
    segmentIds: string[];
}
