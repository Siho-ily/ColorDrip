export interface RainSettings {
    speed: number;              // 방울 낙하 속도 (1–20)
    density: number;            // 방울 생성 빈도 (1–20)
}

export interface Settings {
    colorSpace: 'HSL' | 'OKLCH';
    mixInOKLCH: boolean;        // 색상 혼합 시 OKLCH 공간 사용 여부
    showHexAlways: boolean;
    rain: RainSettings;
}
