import type { Preset, PresetColor, PaletteStore } from '@/types/palette';
import type { HslColor } from '@/types/bubble';

const KEY = 'lco_presets';

export function loadPaletteStore(): PaletteStore {
    try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return { presets: [], activePresetId: null };
        return JSON.parse(raw) as PaletteStore;
    } catch {
        return { presets: [], activePresetId: null };
    }
}

export function savePaletteStore(store: PaletteStore): void {
    localStorage.setItem(KEY, JSON.stringify(store));
}

export function createPreset(name: string): Preset {
    return { id: crypto.randomUUID(), name, colors: [] };
}

export function createPresetColor(color: HslColor): PresetColor {
    return { id: crypto.randomUUID(), color, label: null };
}
