import type { State } from "@/types/state";
import type { HslColor } from "@/types/bubble";
import type { PresetColor } from "@/types/palette";
import ColorWheelPicker from './ui/ColorWheelPicker';
import PaletteSidebar from './ui/PaletteSidebar';

export default class Palette {
    private colorWheelPicker: ColorWheelPicker;
    private paletteSidebar: PaletteSidebar;

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
    }) {
        this.colorWheelPicker = new ColorWheelPicker({ $target });

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
        });
    }

    setState(nextState: State) {
        this.colorWheelPicker.setState(nextState);
        this.paletteSidebar.setState(nextState);
    }
}
