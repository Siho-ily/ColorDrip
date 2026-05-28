import chroma from 'chroma-js';
import ContextMenu from '@/components/ContextMenu/ContextMenu';
import type { MenuItemDef } from '@/types/menu';
import type { HslColor } from '@/types/bubble';
import type { Preset } from '@/types/palette';

export default class ColorSlotContextMenu {
    private menu: ContextMenu;
    private readonly openColorPicker: (initialColor: HslColor, onConfirm: (color: HslColor) => void) => void;
    private readonly openPresetPicker: (presets: Preset[], onSelect: (toPresetId: string) => void) => void;
    private readonly getPresets: () => Preset[];
    private readonly onEdit: (presetId: string, colorId: string, newColor: HslColor) => void;
    private readonly onDelete: (presetId: string, colorId: string) => void;
    private readonly onDuplicate: (presetId: string, colorId: string) => void;
    private readonly onMoveTo: (fromPresetId: string, colorId: string, toPresetId: string) => void;

    constructor({
        openColorPicker,
        openPresetPicker,
        getPresets,
        onEdit,
        onDelete,
        onDuplicate,
        onMoveTo,
    }: {
        openColorPicker: (initialColor: HslColor, onConfirm: (color: HslColor) => void) => void;
        openPresetPicker: (presets: Preset[], onSelect: (toPresetId: string) => void) => void;
        getPresets: () => Preset[];
        onEdit: (presetId: string, colorId: string, newColor: HslColor) => void;
        onDelete: (presetId: string, colorId: string) => void;
        onDuplicate: (presetId: string, colorId: string) => void;
        onMoveTo: (fromPresetId: string, colorId: string, toPresetId: string) => void;
    }) {
        this.openColorPicker = openColorPicker;
        this.openPresetPicker = openPresetPicker;
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

        const { h, s, l } = color;
        const c = chroma.hsl(h, s / 100, l / 100);
        const hex    = c.hex();
        const [r, g, b] = c.rgb().map(Math.round);
        const [hh, ss, ll] = c.hsl();
        const [ol, oc, oh] = c.oklch();
        const rgbStr   = `rgb(${r}, ${g}, ${b})`;
        const hslStr   = `hsl(${Math.round(hh)} ${Math.round(ss * 100)}% ${Math.round(ll * 100)}%)`;
        const oklchStr = `oklch(${(ol * 100).toFixed(1)}% ${oc.toFixed(3)} ${(oh ?? 0).toFixed(1)})`;

        const items: MenuItemDef[] = [
            {
                kind: 'submenu',
                id: 'copy',
                label: '색상 복사',
                items: [
                    { kind: 'action', id: 'copy-hex',   label: 'HEX',   hint: hex,      onSelect: () => navigator.clipboard.writeText(hex) },
                    { kind: 'action', id: 'copy-rgb',   label: 'RGB',   hint: rgbStr,   onSelect: () => navigator.clipboard.writeText(rgbStr) },
                    { kind: 'action', id: 'copy-hsl',   label: 'HSL',   hint: hslStr,   onSelect: () => navigator.clipboard.writeText(hslStr) },
                    { kind: 'action', id: 'copy-oklch', label: 'oklch', hint: oklchStr, onSelect: () => navigator.clipboard.writeText(oklchStr) },
                ],
            },
            { kind: 'separator' },
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
                kind: 'action',
                id: 'move-to',
                label: '다른 프리셋으로 이동',
                onSelect: () => this.openPresetPicker(otherPresets, (toPresetId) => this.onMoveTo(presetId, colorId, toPresetId)),
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
