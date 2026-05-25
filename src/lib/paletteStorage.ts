import type { Preset, PaletteStore } from '@/types/palette';

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

