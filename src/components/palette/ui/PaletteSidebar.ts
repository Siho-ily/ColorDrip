import type { State } from '@/types/state';
import type { PresetColor } from '@/types/palette';
import type { HslColor } from '@/types/bubble';
import PaletteTabBar from './PaletteTabBar';
import PaletteSlotPanel from './PaletteSlotPanel';

export default class PaletteSidebar {
    private $el: HTMLDivElement;
    private tabBar: PaletteTabBar;
    private slotPanel: PaletteSlotPanel;

    constructor({
        $target,
        onAddPreset,
        onSelectPreset,
        onRenamePreset,
        onDeletePreset,
        onDuplicatePreset,
        onReorderPresets,
        onColorSlotClick,
        onAddColor,
        onColorSlotContextMenu,
    }: {
        $target: HTMLElement;
        onAddPreset: () => void;
        onSelectPreset: (presetId: string) => void;
        onRenamePreset: (presetId: string, name: string) => void;
        onDeletePreset: (presetId: string) => void;
        onDuplicatePreset: (presetId: string) => void;
        onReorderPresets: (orderedIds: string[]) => void;
        onColorSlotClick: (presetColor: PresetColor) => void;
        onAddColor: () => void;
        onColorSlotContextMenu: (presetId: string, colorId: string, color: HslColor, rect: DOMRect) => void;
    }) {
        this.$el = document.createElement('div');
        this.$el.className = 'fixed right-0 top-0 h-full z-30 flex hidden';
        $target.appendChild(this.$el);

        this.tabBar = new PaletteTabBar({
            $target: this.$el,
            onAddPreset,
            onSelectPreset,
            onRenamePreset,
            onDeletePreset,
            onDuplicatePreset,
            onReorderPresets,
        });

        this.slotPanel = new PaletteSlotPanel({
            $target: this.$el,
            onColorSlotClick,
            onAddColor,
            onColorSlotContextMenu,
        });
    }

    setState(state: State) {
        const { open, presets, activePresetId } = state.palette;

        if (open) {
            this.$el.classList.remove('hidden');
        } else {
            this.$el.classList.add('hidden');
            return;
        }

        this.tabBar.render(presets, activePresetId);
        this.slotPanel.render(presets.find(p => p.id === activePresetId) ?? null);
    }
}
