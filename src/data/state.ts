import type { State } from '@/types/state';

const initialState: State = {
    rainMode: false,
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
        rain: { speed: 10, density: 10 },
    },
    ui: {
        visible: false,
        fadeTimer: null,
    },
};

export default initialState;
