import ColorWheelPicker from './ui/ColorWheelPicker.js';
import PaletteSidebar from './ui/PaletteSidebar.js';

export default function Palette({ $target, initState, onBlobCreate }) {
    this.state = initState;

    const colorWheelPicker = new ColorWheelPicker({ $target });
    const paletteSidebar = new PaletteSidebar({ $target });

    // ColorWheelPicker에서 색 선택 → PaletteSidebar에 추가
    // PaletteSidebar 항목 클릭 → onBlobCreate(color) 로 App에 위임

    this.setState = (nextState) => {
        this.state = nextState;
        colorWheelPicker.setState(nextState);
        paletteSidebar.setState(nextState);
    };

    if (initState) this.setState(initState);
}
