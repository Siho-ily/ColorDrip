export interface RainSettings {
    speed: number;      // 방울 낙하 속도 (1–20)
    density: number;    // 방울 생성 빈도 (1–20)
    size: number;       // 방울 크기 (1–20)
    wind: number;       // 바람 수평 속도 (px/frame). 양수 = 오른쪽, 음수 = 왼쪽
}

/**
 * chroma-js의 mix() 함수가 지원하는 색 공간 목록.
 * 각 값은 chroma.mix(c1, c2, ratio, colorSpace)의 세 번째 인자로 그대로 전달된다.
 *
 * - rgb    : 가장 단순. 중간값이 탁해 보일 수 있음
 * - hsl    : 색상환 기반. 보색끼리 섞으면 회색 구간을 지남
 * - hsv    : HSL과 유사하나 명도 계산 방식이 다름
 * - hsi    : 강도(intensity) 기반. 지각보다 수치 균형에 가까움
 * - lab    : CIELAB. 지각 균일 공간으로 자연스러운 혼합
 * - lch    : LAB의 극좌표 버전. hue 회전이 부드러움
 * - oklch  : LCH의 개선판. 더 고른 밝기 유지
 * - oklab  : OKLab. OKLCH의 직교 좌표 버전
 * - lrgb   : 선형 RGB. 감마 보정 없이 혼합 → 물리적으로 정확
 */
export type ColorSpace = 'rgb' | 'hsl' | 'hsv' | 'hsi' | 'lab' | 'lch' | 'oklch' | 'oklab' | 'lrgb';

export interface Settings {
    colorSpace: ColorSpace;     // 색상 혼합에 사용할 색 공간
    showHexAlways: boolean;     // 버블에 hex 코드를 항상 표시할지 여부
    darkMode: boolean;          // 다크 모드
    rain: RainSettings;         // 비 관련 세부 설정
}
