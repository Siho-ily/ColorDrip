import type { State } from "@/types/state";
import type { HslColor } from "@/types/bubble";
import type { PresetColor } from "@/types/palette";
import ColorWheelPicker from './ui/ColorWheelPicker';
import PaletteSidebar from './ui/PaletteSidebar';
import PaletteToggleButton from './ui/PaletteToggleButton';

export default class Palette {
    private colorWheelPicker: ColorWheelPicker;
    private paletteSidebar: PaletteSidebar;
    private toggleButton: PaletteToggleButton;

    constructor({
        $target,
        onAddPreset,
        onSelectPreset,
        onRenamePreset,
        onDeletePreset,
        onColorSlotClick,
        onAddColorToPreset,
        onToggleOpen,
    }: {
        $target: HTMLElement;
        onAddPreset: () => void;
        onSelectPreset: (presetId: string) => void;
        onRenamePreset: (presetId: string, name: string) => void;
        onDeletePreset: (presetId: string) => void;
        onColorSlotClick: (presetColor: PresetColor) => void;
        onAddColorToPreset: (color: HslColor) => void;
        onToggleOpen: () => void;
    }) {
        this.colorWheelPicker = new ColorWheelPicker({ $target });

        this.paletteSidebar = new PaletteSidebar({
            $target,
            onAddPreset,
            onSelectPreset,
            onRenamePreset,
            onDeletePreset,
            onColorSlotClick,
            onAddColor: () => this.colorWheelPicker.open((color) => onAddColorToPreset(color)),
        });

        this.toggleButton = new PaletteToggleButton({ $target, onToggle: onToggleOpen });
    }

    setState(nextState: State) {
        this.colorWheelPicker.setState(nextState);
        this.paletteSidebar.setState(nextState);
        this.toggleButton.setState(nextState);
    }
}
