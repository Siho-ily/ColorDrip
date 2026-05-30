/**
 * 다중 선택된 팔레트 색상 슬롯을 대상으로 하는 컨텍스트 메뉴.
 *
 * 캔버스의 SelectionContextMenu를 미러링한다.
 * 항목: 캔버스에 추가 / 다른 프리셋으로 이동 / 삭제.
 * "이동"은 다른 프리셋이 있을 때만 표시한다.
 */
import ContextMenu from '@/components/ContextMenu/ContextMenu';
import type { MenuItemDef } from '@/types/menu';
import type { Preset } from '@/types/palette';

export default class PaletteSelectionContextMenu {
    private menu: ContextMenu;
    private readonly openPresetPicker: (presets: Preset[], onSelect: (toPresetId: string) => void) => void;
    private readonly getPresets: () => Preset[];
    private readonly getActivePresetId: () => string | null;
    private readonly onAddToCanvas: () => void;
    private readonly onMoveToPreset: (toPresetId: string) => void;
    private readonly onDelete: () => void;

    constructor({
        openPresetPicker,
        getPresets,
        getActivePresetId,
        onAddToCanvas,
        onMoveToPreset,
        onDelete,
    }: {
        openPresetPicker: (presets: Preset[], onSelect: (toPresetId: string) => void) => void;
        getPresets: () => Preset[];
        getActivePresetId: () => string | null;
        onAddToCanvas: () => void;
        onMoveToPreset: (toPresetId: string) => void;
        onDelete: () => void;
    }) {
        this.openPresetPicker = openPresetPicker;
        this.getPresets = getPresets;
        this.getActivePresetId = getActivePresetId;
        this.onAddToCanvas = onAddToCanvas;
        this.onMoveToPreset = onMoveToPreset;
        this.onDelete = onDelete;

        this.menu = new ContextMenu({ onClose: () => {} });
    }

    open(anchorRect: DOMRect, count: number) {
        this.menu.show(anchorRect, this.buildItems(count));
    }

    private buildItems(count: number): MenuItemDef[] {
        const activeId = this.getActivePresetId();
        const otherPresets = this.getPresets().filter(p => p.id !== activeId);

        const items: MenuItemDef[] = [
            { kind: 'action', id: 'add-canvas', label: `캔버스에 추가 (${count})`, onSelect: () => this.onAddToCanvas() },
        ];

        if (otherPresets.length > 0) {
            items.push({
                kind: 'action',
                id: 'move-to',
                label: '다른 프리셋으로 이동',
                onSelect: () => this.openPresetPicker(otherPresets, (toId) => this.onMoveToPreset(toId)),
            });
        }

        items.push(
            { kind: 'separator' },
            { kind: 'action', id: 'delete', label: `삭제 (${count})`, danger: true, onSelect: () => this.onDelete() },
        );

        return items;
    }
}
