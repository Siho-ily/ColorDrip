import type { Bubble, HslColor } from './bubble';
import type { Settings } from './settings';

export interface PaletteState {
    open: boolean;
    presets: unknown[];          // 추후 Preset 타입으로 교체 예정
    activePresetId: string | null;
}

/** ColorWheelPicker 오버레이 상태 */
export interface PickerState {
    open: boolean;
    color: HslColor;            // 현재 선택 중인 색상
}


export interface State {
    rainMode: boolean;
    bubbles: Bubble[];
    palette: PaletteState;
    picker: PickerState;
    selectedBubbleIds: number[]; // 다중 선택된 버블 id 목록
    settings: Settings;
    ui: {
        visible: boolean;        // TopBar/BottomBar 표시 여부
        fadeTimer: ReturnType<typeof setTimeout> | null; // 자동 숨김 타이머
    };
}
