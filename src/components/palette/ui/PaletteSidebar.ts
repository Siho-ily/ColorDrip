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
        this.$el.className = 'fixed right-0 top-0 h-full z-30 flex translate-x-full pointer-events-none transition-transform duration-200 ease-out';
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
            this.$el.classList.remove('translate-x-full', 'pointer-events-none');
        } else {
            this.$el.classList.add('translate-x-full', 'pointer-events-none');
            return;
        }

        this.tabBar.render(presets, activePresetId);
        this.slotPanel.render(presets.find(p => p.id === activePresetId) ?? null);
    }

    // 팔레트가 화면 우측에서 차지하는 픽셀 너비. 닫혀 있으면 0.
    // translate-x-full로 화면 밖에 밀려나 있어도 offsetWidth는 그대로라 classList로 판단한다.
    getOccupiedWidth(): number {
        if (this.$el.classList.contains('translate-x-full')) return 0;
        return this.$el.offsetWidth;
    }
}
