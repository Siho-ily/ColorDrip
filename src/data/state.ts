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
    settings: {
        colorSpace: 'hsl',
        showHexAlways: false,
        rain: { speed: 10, density: 10, size: 10, tolerance: 15 },
    },
    ui: {
        visible: false,
        fadeTimer: null,
    },
};

export default initialState;
