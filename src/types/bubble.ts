/** falling → catching → floating → dragging */
export type BubbleLifecycle = 'falling' | 'catching' | 'floating' | 'dragging';

/** HSL 색상값 (h: 0–360, s/l: 0–100) */
export interface HslColor {
    h: number;
    s: number;
    l: number;
}

/** 개별 버블 객체. Matter.js body와 1:1 대응하다가 catch 시점에 DOM div로 전환된다. */
export interface Bubble {
    id: number;
    name: string | null;        // 사용자가 지정한 이름, 없으면 null
    color: HslColor;
    radius: number;
    position: { x: number; y: number };
    velocity: { x: number; y: number }; // catch 시점 속도 → float 애니메이션 초기값
    state: BubbleLifecycle;
}
