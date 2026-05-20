import type { State } from '@/types/state';

const initialState: State = {
    rainMode: true,
    bubbles: [],
    palette: {
        open: false,
        presets: [],
        activePresetId: null,
    },
    picker: {
        open: false,
        color: { h: 0, s: 100, l: 50 },
    },
    selectedBubbleIds: [],
    contextMenu: { open: false, bubbleId: null, x: 0, y: 0 },
    settings: {
        colorSpace: 'hsl',
        showHexAlways: false,
        rain: { speed: 10, density: 10, size: 10, wind: 2.5 },
    },
    ui: {
        visible: false,
        fadeTimer: null,
    },
};

export default initialState;
