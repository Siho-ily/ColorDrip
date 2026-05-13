import type { State } from "@/types/state";
import type { HslColor } from "@/types/bubble";
import ColorWheelPicker from './ui/ColorWheelPicker';
import PaletteSidebar from './ui/PaletteSidebar';

export default class Palette {
    private colorWheelPicker: ColorWheelPicker;
    private paletteSidebar: PaletteSidebar;
    private onBubbleCreate: (color: HslColor) => void;
    state?: State;

    constructor({ $target, onBubbleCreate }: { $target: HTMLElement; onBubbleCreate: (color: HslColor) => void }) {
        this.onBubbleCreate = onBubbleCreate;
        this.colorWheelPicker = new ColorWheelPicker({ $target });
        this.paletteSidebar = new PaletteSidebar({ $target });
        // ColorWheelPicker에서 색 선택 → PaletteSidebar에 추가
        // PaletteSidebar 항목 클릭 → onBubbleCreate(color) 로 App에 위임
    }

    setState(nextState: State) {
        this.state = nextState;
        this.colorWheelPicker.setState(nextState);
        this.paletteSidebar.setState(nextState);
    }
}
