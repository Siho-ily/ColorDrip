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
    selectedColorIds: [],
    contextMenu: { open: false, mode: 'single', bubbleId: null, x: 0, y: 0 },
    settings: {
        colorMixing: 'hsl',
        colorNotation: 'hex',
        pickerNotation: 'hex',
        darkMode: false,
        rain: { speed: 10, density: 10, size: 4, wind: 0 },
        bubble: { size: 5 },
    },
    ui: {
        visible: false,
        fadeTimer: null,
    },
};

export default initialState;
