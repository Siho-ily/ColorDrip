import type { Blob, HslColor } from './blob';

export interface PaletteState {
    open: boolean;
    presets: unknown[];
    activePresetId: string | null;
}

export interface PickerState {
    open: boolean;
    color: HslColor;
}

export interface RainSettings {
    speed: number;
    density: number;
}

export interface Settings {
    colorSpace: 'HSL' | 'OKLCH';
    mixInOKLCH: boolean;
    showHexAlways: boolean;
    rain: RainSettings;
}

export interface State {
    rainMode: boolean;
    blobs: Blob[];
    palette: PaletteState;
    picker: PickerState;
    selectedBlobIds: string[];
    settings: Settings;
    ui: {
        visible: boolean;
        fadeTimer: ReturnType<typeof setTimeout> | null;
    };
}
