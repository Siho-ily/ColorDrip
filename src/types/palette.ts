import type { HslColor } from './bubble';

export interface PresetColor {
    id: string;
    color: HslColor;
    label: string | null;
}

export interface Preset {
    id: string;
    name: string;
    colors: PresetColor[];
}

export interface PaletteStore {
    presets: Preset[];
    activePresetId: string | null;
}
