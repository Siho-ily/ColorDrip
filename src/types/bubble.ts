/** falling → catching → floating → dragging */
export type BubbleLifecycle = 'falling' | 'catching' | 'floating' | 'dragging' | 'selected';

/** HSL 색상값 (h: 0–360, s/l: 0–100) */
export interface HslColor {
    h: number;  // hue: 색상 (0–360)
    s: number;  // saturation: 채도 (0–100)
    l: number;  // lightness: 밝기 (0–100)
}

/** 개별 버블 객체. Matter.js body와 1:1 대응하다가 catch 시점에 DOM div로 전환된다. */
export interface Bubble {
    id: number;                                 // 버블 고유 식별자
    name: string | null;                        // 사용자가 지정한 이름, 없으면 null
    color: HslColor;                            // 버블 색상
    radius: number;                             // 반지름 (px)
    position: { x: number; y: number };         // 중심 좌표 (px). BubbleLayer 기준
    velocity: { x: number; y: number };         // catch 시점 속도 → float 애니메이션 초기값
    state: BubbleLifecycle;                     // 현재 생명주기 단계
}
