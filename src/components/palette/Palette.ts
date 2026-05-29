import type { State } from "@/types/state";
import type { HslColor } from "@/types/bubble";
import type { PresetColor, Preset } from "@/types/palette";
import type { ColorNotation } from "@/types/settings";

import ColorWheelPicker from './ui/ColorWheelPicker';
import PaletteSidebar from './ui/PaletteSidebar';
import PresetPickerModal from './ui/PresetPickerModal';
import ColorSlotContextMenu from '@/components/ContextMenu/ColorSlotContextMenu';
import PaletteSelectionContextMenu from '@/components/ContextMenu/PaletteSelectionContextMenu';

export default class Palette {
    private colorWheelPicker: ColorWheelPicker;
    private presetPickerModal: PresetPickerModal;
    private paletteSidebar: PaletteSidebar;
    private colorSlotContextMenu: ColorSlotContextMenu;
    private paletteSelectionContextMenu: PaletteSelectionContextMenu;
    private colorNotation: ColorNotation = 'hex';
    private readonly getSelectedColorIds: () => string[];

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
        onAddColorToPreset,
        getPresets,
        getActivePresetId,
        getSelectedColorIds,
        onEditPresetColor,
        onDeletePresetColor,
        onDuplicatePresetColor,
        onMoveColorToPreset,
        onReorderPresetColors,
        onMoveColorsToPreset,
        onDropColorsToCanvas,
        onAddSelectedColorsToCanvas,
        onMoveSelectedColorsToPreset,
        onDeleteSelectedColors,
        onPickerNotationChange,
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
        onAddColorToPreset: (color: HslColor) => void;
        getPresets: () => Preset[];
        getActivePresetId: () => string | null;
        getSelectedColorIds: () => string[];
        onEditPresetColor: (presetId: string, colorId: string, newColor: HslColor) => void;
        onDeletePresetColor: (presetId: string, colorId: string) => void;
        onDuplicatePresetColor: (presetId: string, colorId: string) => void;
        onMoveColorToPreset: (fromPresetId: string, colorId: string, toPresetId: string) => void;
        onReorderPresetColors: (presetId: string, newColorIds: string[]) => void;
        onMoveColorsToPreset: (fromPresetId: string, colorIds: string[], toPresetId: string) => void;
        onDropColorsToCanvas: (presetId: string, colorIds: string[], x: number, y: number) => void;
        onAddSelectedColorsToCanvas: () => void;
        onMoveSelectedColorsToPreset: (toPresetId: string) => void;
        onDeleteSelectedColors: () => void;
        onPickerNotationChange: (notation: ColorNotation) => void;
    }) {
        this.getSelectedColorIds = getSelectedColorIds;

        this.colorWheelPicker = new ColorWheelPicker({ $target, onPickerNotationChange });
        this.presetPickerModal = new PresetPickerModal();

        this.colorSlotContextMenu = new ColorSlotContextMenu({
            openColorPicker: (initialColor, onConfirm) => this.colorWheelPicker.open(onConfirm, initialColor),
            openPresetPicker: (presets, onSelect) => this.presetPickerModal.open(presets, onSelect),
            getPresets,
            onEdit: onEditPresetColor,
            onDelete: onDeletePresetColor,
            onDuplicate: onDuplicatePresetColor,
            onMoveTo: onMoveColorToPreset,
        });

        this.paletteSelectionContextMenu = new PaletteSelectionContextMenu({
            openPresetPicker: (presets, onSelect) => this.presetPickerModal.open(presets, onSelect),
            getPresets,
            getActivePresetId,
            onAddToCanvas: onAddSelectedColorsToCanvas,
            onMoveToPreset: onMoveSelectedColorsToPreset,
            onDelete: onDeleteSelectedColors,
        });

        this.paletteSidebar = new PaletteSidebar({
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
            onAddColor: () => this.colorWheelPicker.open((color) => onAddColorToPreset(color)),
            // 선택된 색이 1개 이상이면 일괄 메뉴, 아니면 단일 색 메뉴 (캔버스 라우팅과 동일)
            onColorSlotContextMenu: (presetId, colorId, color, rect) => {
                const count = this.getSelectedColorIds().length;
                if (count > 0) {
                    this.paletteSelectionContextMenu.open(rect, count);
                } else {
                    this.colorSlotContextMenu.open(presetId, colorId, color, rect);
                }
            },
            onReorderColors: onReorderPresetColors,
            onMoveColorsToPreset,
            onDropColorsToCanvas,
            getColorNotation: () => this.colorNotation,
            getSelectedColorIds,
        });
    }

    setState(nextState: State) {
        this.colorNotation = nextState.settings.colorNotation;
        this.colorWheelPicker.setState(nextState);
        this.paletteSidebar.setState(nextState);
    }

    /** 외부 트리거(예: 캔버스 FAB)에서 컬러피커를 열기 위한 노출 메서드. */
    openColorPicker(onConfirm: (color: HslColor) => void, initial?: HslColor) {
        this.colorWheelPicker.open(onConfirm, initial);
    }

    getOccupiedWidth(): number {
        return this.paletteSidebar.getOccupiedWidth();
    }
}
