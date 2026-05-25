import type { State } from "@/types/state";
import type { HslColor } from "@/types/bubble";
import type { PresetColor, Preset } from "@/types/palette";
import ColorWheelPicker from './ui/ColorWheelPicker';
import PaletteSidebar from './ui/PaletteSidebar';
import PresetPickerModal from './ui/PresetPickerModal';
import ColorSlotContextMenu from '@/components/ContextMenu/ColorSlotContextMenu';

export default class Palette {
    private colorWheelPicker: ColorWheelPicker;
    private presetPickerModal: PresetPickerModal;
    private paletteSidebar: PaletteSidebar;
    private colorSlotContextMenu: ColorSlotContextMenu;

    constructor({
        $target,
        onAddPreset,
        onSelectPreset,
        onRenamePreset,
        onDeletePreset,
        onDuplicatePreset,
        onReorderPresets,
        onColorSlotClick,
        onAddColorToPreset,
        getPresets,
        onEditPresetColor,
        onDeletePresetColor,
        onDuplicatePresetColor,
        onMoveColorToPreset,
    }: {
        $target: HTMLElement;
        onAddPreset: () => void;
        onSelectPreset: (presetId: string) => void;
        onRenamePreset: (presetId: string, name: string) => void;
        onDeletePreset: (presetId: string) => void;
        onDuplicatePreset: (presetId: string) => void;
        onReorderPresets: (orderedIds: string[]) => void;
        onColorSlotClick: (presetColor: PresetColor) => void;
        onAddColorToPreset: (color: HslColor) => void;
        getPresets: () => Preset[];
        onEditPresetColor: (presetId: string, colorId: string, newColor: HslColor) => void;
        onDeletePresetColor: (presetId: string, colorId: string) => void;
        onDuplicatePresetColor: (presetId: string, colorId: string) => void;
        onMoveColorToPreset: (fromPresetId: string, colorId: string, toPresetId: string) => void;
    }) {
        this.colorWheelPicker = new ColorWheelPicker({ $target });
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

        this.paletteSidebar = new PaletteSidebar({
            $target,
            onAddPreset,
            onSelectPreset,
            onRenamePreset,
            onDeletePreset,
            onDuplicatePreset,
            onReorderPresets,
            onColorSlotClick,
            onAddColor: () => this.colorWheelPicker.open((color) => onAddColorToPreset(color)),
            onColorSlotContextMenu: (presetId, colorId, color, rect) =>
                this.colorSlotContextMenu.open(presetId, colorId, color, rect),
        });
    }

    setState(nextState: State) {
        this.colorWheelPicker.setState(nextState);
        this.paletteSidebar.setState(nextState);
    }
}
