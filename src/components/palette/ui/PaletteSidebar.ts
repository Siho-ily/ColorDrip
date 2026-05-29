import type { State } from '@/types/state';
import type { Preset, PresetColor } from '@/types/palette';
import type { HslColor } from '@/types/bubble';
import type { ColorNotation } from '@/types/settings';
import PaletteTabBar from './PaletteTabBar';
import PaletteSlotPanel from './PaletteSlotPanel';
import PaletteColorDrag from './PaletteColorDrag';

export default class PaletteSidebar {
    private $el: HTMLDivElement;
    private $dropZone: HTMLDivElement;
    private tabBar: PaletteTabBar;
    private slotPanel: PaletteSlotPanel;
    private colorDrag: PaletteColorDrag;

    // 직전 렌더에 쓰인 값. presets/activePresetId가 그대로면 재렌더 없이 선택 ring만 동기화한다.
    private prevPresets: Preset[] | null = null;
    private prevActiveId: string | null | undefined = undefined;

    constructor({
        $target,
        onAddPreset,
        onSelectPreset,
        onRenamePreset,
        onDeletePreset,
        onDuplicatePreset,
        onReorderPresets,
        onColorSlotSelect,
        onColorSlotActivate,
        onMarqueeSelect,
        onEmptySelectionClick,
        onAddColor,
        onColorSlotContextMenu,
        onReorderColors,
        onMoveColorsToPreset,
        onDropColorsToCanvas,
        getColorNotation,
        getSelectedColorIds,
    }: {
        $target: HTMLElement;
        onAddPreset: () => void;
        onSelectPreset: (presetId: string) => void;
        onRenamePreset: (presetId: string, name: string) => void;
        onDeletePreset: (presetId: string) => void;
        onDuplicatePreset: (presetId: string) => void;
        onReorderPresets: (orderedIds: string[]) => void;
        onColorSlotSelect: (colorId: string, additive: boolean) => void;
        onColorSlotActivate: (presetColor: PresetColor) => void;
        onMarqueeSelect: (colorIds: string[], additive: boolean) => void;
        onEmptySelectionClick: () => void;
        onAddColor: () => void;
        onColorSlotContextMenu: (presetId: string, colorId: string, color: HslColor, rect: DOMRect) => void;
        onReorderColors: (presetId: string, newColorIds: string[]) => void;
        onMoveColorsToPreset: (fromPresetId: string, colorIds: string[], toPresetId: string) => void;
        onDropColorsToCanvas: (presetId: string, colorIds: string[], x: number, y: number) => void;
        getColorNotation: () => ColorNotation;
        getSelectedColorIds: () => string[];
    }) {
        this.$el = document.createElement('div');
        this.$el.className = 'fixed right-0 top-0 h-full z-30 flex translate-x-full pointer-events-none transition-transform duration-200 ease-out select-none';
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
            onMoveColorsToPreset,
            onDropColorsToCanvas,
        );

        // 버블을 팔레트 위로 드래그할 때 나타나는 드롭 존. pointer-events: none이라 하위 조작을 막지 않는다.
        this.$dropZone = document.createElement('div');
        this.$dropZone.className = 'absolute inset-0 z-50 hidden flex-col items-center justify-center gap-2 pointer-events-none';
        Object.assign(this.$dropZone.style, {
            background: 'rgba(99,102,241,0.12)',
            border: '2px dashed rgba(99,102,241,0.5)',
            borderRadius: '0',
        });
        this.$dropZone.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,0.9)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 5v14M5 12l7 7 7-7"/>
            </svg>
            <span style="font-size:0.7rem;font-weight:600;color:rgba(99,102,241,0.9);text-align:center;line-height:1.4;letter-spacing:0.01em">프리셋에 추가</span>
        `;
        this.$el.appendChild(this.$dropZone);

        this.slotPanel = new PaletteSlotPanel({
            $target: this.$el,
            onColorSlotSelect,
            onColorSlotActivate,
            onMarqueeSelect,
            onEmptyClick: onEmptySelectionClick,
            onAddColor,
            onColorSlotContextMenu,
            onSlotDragStart: (presetId, colorIds, cssColor, $slot, e) =>
                this.colorDrag.start(presetId, colorIds, cssColor, $slot, e),
            getColorNotation,
            getSelectedColorIds,
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

        // presets/활성 프리셋이 바뀌었을 때만 재렌더. 선택만 바뀐 경우는 ring class만 증분 동기화.
        const contentChanged = presets !== this.prevPresets || activePresetId !== this.prevActiveId;
        if (contentChanged) {
            this.tabBar.render(presets, activePresetId);
            this.slotPanel.render(presets.find(p => p.id === activePresetId) ?? null);
            this.prevPresets = presets;
            this.prevActiveId = activePresetId;
        } else {
            this.slotPanel.syncSelection(new Set(state.selectedColorIds));
        }
    }

    // 팔레트가 화면 우측에서 차지하는 픽셀 너비. 닫혀 있으면 0.
    // translate-x-full로 화면 밖에 밀려나 있어도 offsetWidth는 그대로라 classList로 판단한다.
    getOccupiedWidth(): number {
        if (this.$el.classList.contains('translate-x-full')) return 0;
        return this.$el.offsetWidth;
    }

    // 버블 드래그 드롭 존 오버레이 표시/숨김. 팔레트가 열려 있을 때만 표시한다.
    setDropZoneVisible(show: boolean) {
        if (show && !this.$el.classList.contains('translate-x-full')) {
            this.$dropZone.classList.remove('hidden');
            this.$dropZone.classList.add('flex');
        } else {
            this.$dropZone.classList.add('hidden');
            this.$dropZone.classList.remove('flex');
        }
    }
}
