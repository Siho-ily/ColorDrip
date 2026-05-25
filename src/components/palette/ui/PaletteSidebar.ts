import type { State } from '@/types/state';
import type { PresetColor } from '@/types/palette';
import type { HslColor } from '@/types/bubble';
import PaletteTabBar from './PaletteTabBar';
import PaletteSlotPanel from './PaletteSlotPanel';
import PaletteColorDrag from './PaletteColorDrag';

export default class PaletteSidebar {
    private $el: HTMLDivElement;
    private tabBar: PaletteTabBar;
    private slotPanel: PaletteSlotPanel;
    private colorDrag: PaletteColorDrag;

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
        onReorderColors,
        onMoveColorToPreset,
        onDropColorToCanvas,
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
        onReorderColors: (presetId: string, newColorIds: string[]) => void;
        onMoveColorToPreset: (fromPresetId: string, colorId: string, toPresetId: string) => void;
        onDropColorToCanvas: (presetId: string, colorId: string) => void;
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

        this.colorDrag = new PaletteColorDrag(
            () => this.$el,
            () => [...this.$el.querySelectorAll<HTMLElement>('[data-preset-id]')],
            () => [...this.$el.querySelectorAll<HTMLElement>('[data-color-id]')],
            onReorderColors,
            onMoveColorToPreset,
            onDropColorToCanvas,
        );

        this.slotPanel = new PaletteSlotPanel({
            $target: this.$el,
            onColorSlotClick,
            onAddColor,
            onColorSlotContextMenu,
            onSlotDragStart: (presetId, colorId, cssColor, $slot, e) =>
                this.colorDrag.start(presetId, colorId, cssColor, $slot, e),
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
