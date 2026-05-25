import ContextMenu from '@/components/ContextMenu/ContextMenu';
import type { MenuItemDef } from '@/types/menu';
import type { HslColor } from '@/types/bubble';
import type { Preset } from '@/types/palette';

export default class ColorSlotContextMenu {
    private menu: ContextMenu;
    private readonly openColorPicker: (initialColor: HslColor, onConfirm: (color: HslColor) => void) => void;
    private readonly getPresets: () => Preset[];
    private readonly onEdit: (presetId: string, colorId: string, newColor: HslColor) => void;
    private readonly onDelete: (presetId: string, colorId: string) => void;
    private readonly onDuplicate: (presetId: string, colorId: string) => void;
    private readonly onMoveTo: (fromPresetId: string, colorId: string, toPresetId: string) => void;

    constructor({
        openColorPicker,
        getPresets,
        onEdit,
        onDelete,
        onDuplicate,
        onMoveTo,
    }: {
        openColorPicker: (initialColor: HslColor, onConfirm: (color: HslColor) => void) => void;
        getPresets: () => Preset[];
        onEdit: (presetId: string, colorId: string, newColor: HslColor) => void;
        onDelete: (presetId: string, colorId: string) => void;
        onDuplicate: (presetId: string, colorId: string) => void;
        onMoveTo: (fromPresetId: string, colorId: string, toPresetId: string) => void;
    }) {
        this.openColorPicker = openColorPicker;
        this.getPresets = getPresets;
        this.onEdit = onEdit;
        this.onDelete = onDelete;
        this.onDuplicate = onDuplicate;
        this.onMoveTo = onMoveTo;

        this.menu = new ContextMenu({ onClose: () => {} });
    }

    open(presetId: string, colorId: string, color: HslColor, rect: DOMRect) {
        this.menu.show(rect, this.buildItems(presetId, colorId, color));
    }

    private buildItems(presetId: string, colorId: string, color: HslColor): MenuItemDef[] {
        const otherPresets = this.getPresets().filter(p => p.id !== presetId);

        const items: MenuItemDef[] = [
            {
                kind: 'action',
                id: 'edit',
                label: '색상 편집',
                onSelect: () => this.openColorPicker(color, (newColor) => this.onEdit(presetId, colorId, newColor)),
            },
            {
                kind: 'action',
                id: 'duplicate',
                label: '복제',
                onSelect: () => this.onDuplicate(presetId, colorId),
            },
        ];

        if (otherPresets.length > 0) {
            items.push({
                kind: 'submenu',
                id: 'move-to',
                label: '다른 프리셋으로 이동',
                items: otherPresets.map(p => ({
                    kind: 'action',
                    id: `move-${p.id}`,
                    label: p.name,
                    onSelect: () => this.onMoveTo(presetId, colorId, p.id),
                })),
            });
        }

        items.push(
            { kind: 'separator' },
            {
                kind: 'action',
                id: 'delete',
                label: '삭제',
                danger: true,
                onSelect: () => this.onDelete(presetId, colorId),
            },
        );

        return items;
    }
}
