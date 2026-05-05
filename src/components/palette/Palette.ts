import type { State } from "@/types/state";
import type { HslColor } from "@/types/blob";
import ColorWheelPicker from './ui/ColorWheelPicker';
import PaletteSidebar from './ui/PaletteSidebar';

export default class Palette {
    private colorWheelPicker: ColorWheelPicker;
    private paletteSidebar: PaletteSidebar;
    private onBlobCreate: (color: HslColor) => void;
    state?: State;

    constructor({ $target, onBlobCreate }: { $target: HTMLElement; onBlobCreate: (color: HslColor) => void }) {
        this.onBlobCreate = onBlobCreate;
        this.colorWheelPicker = new ColorWheelPicker({ $target });
        this.paletteSidebar = new PaletteSidebar({ $target });
        // ColorWheelPicker에서 색 선택 → PaletteSidebar에 추가
        // PaletteSidebar 항목 클릭 → onBlobCreate(color) 로 App에 위임
    }

    setState(nextState: State) {
        this.state = nextState;
        this.colorWheelPicker.setState(nextState);
        this.paletteSidebar.setState(nextState);
    }
}
