// ─── RainCanvas ───────────────────────────────────────────────────────────────

/** Matter.js 엔진 기본 중력. scale은 Matter.js 내부 단위 */
export const GRAVITY = { x: 0, y: 1, scale: 0.0005 };

/** 방울 클릭 히트 영역 여유 (px). 중심 거리 기반 판정에 더해 체감 클릭률을 높임 */
export const TOLERANCE = 15;

/**
 * 크기 설정값(1–20) → 반지름(px) 변환.
 * size=1: 10px, size=10: 28px, size=20: 48px
 * 빗방울과 팔레트 버블 모두 이 함수로 반지름을 결정해 크기를 동기화한다.
 */
export const RADIUS_BASE = 8;
export const RADIUS_FACTOR = 2;
export function radiusFromSize(size: number): number {
    return RADIUS_BASE + size * RADIUS_FACTOR;
}

/** density(1–20) → 생성 간격(ms). interval = DENSITY_INTERVAL_BASE / density */
export const DENSITY_INTERVAL_BASE = 2000;

/** 방울 색상 채도 범위: min ~ min+range */
export const DROP_SATURATION = { min: 70, range: 30 };

/** 방울 색상 밝기 범위: min ~ min+range */
export const DROP_LIGHTNESS = { min: 50, range: 15 };

/** 화면 밖 body 정리 주기 (ms) */
export const CLEANUP_INTERVAL = 3000;

/** 화면 밖 판정 여유 (px) */
export const OFFSCREEN_MARGIN = { bottom: 100, side: 200 };

// ─── RainDrop ─────────────────────────────────────────────────────────────────

/** 방울 탄성 계수 (0 = 완전 비탄성, 1 = 완전 탄성) */
export const DROP_RESTITUTION = 0.3;

// ─── BubbleCanvas ─────────────────────────────────────────────────────────────

/** 버블 탄성 계수 */
export const BUBBLE_RESTITUTION = 0.85;

/** 버블 공기 저항 (0에 가까울수록 오래 떠다님) */
export const BUBBLE_FRICTION_AIR = 0.008;

/** 벽 두께 (px). 뷰포트 바깥에 위치해 시각적으로 보이지 않음 */
export const BUBBLE_WALL_THICKNESS = 100;

/** catch 시점 속도 스케일. rain drop 속도를 줄여 float 느낌을 냄 */
export const BUBBLE_VELOCITY_SCALE = 0.3;
