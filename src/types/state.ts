import type { Bubble, HslColor } from './bubble';
import type { Settings } from './settings';
import type { Preset } from './palette';

export interface ContextMenuState {
    open: boolean;
    bubbleId: number | null;
    x: number;
    y: number;
}

export interface PaletteState {
    open: boolean;
    presets: Preset[];
    activePresetId: string | null;
}

/** ColorWheelPicker 오버레이 상태 */
export interface PickerState {
    open: boolean;                      // 피커 표시 여부
    color: HslColor;                    // 현재 선택 중인 색상
}

export interface State {
    rainMode: boolean;                  // 방울 낙하 활성화 여부
    bubbles: Bubble[];                  // 현재 존재하는 버블 목록
    palette: PaletteState;              // 팔레트 사이드바 상태
    picker: PickerState;                // 색상 피커 상태
    selectedBubbleIds: number[];        // 다중 선택된 버블 id 목록
    contextMenu: ContextMenuState;      // 버블 우클릭 컨텍스트 메뉴
    settings: Settings;                 // 사용자 설정
    ui: {
        visible: boolean;               // TopBar/BottomBar 표시 여부
        fadeTimer: ReturnType<typeof setTimeout> | null; // 자동 숨김 타이머
    };
}
