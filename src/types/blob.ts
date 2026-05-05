export type BlobLifecycle = 'falling' | 'catching' | 'floating' | 'dragging' | 'saved';

export interface HslColor {
    h: number;
    s: number;
    l: number;
}

export interface Blob {
    id: string;
    name: string | null;
    color: HslColor;
    radius: number;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    state: BlobLifecycle;
}
