// ─── RainCanvas ───────────────────────────────────────────────────────────────

/** Matter.js 엔진 기본 중력. scale은 Matter.js 내부 단위 */
export const GRAVITY = { x: 0, y: 1, scale: 0.0005 };

/** 방울 클릭 히트 영역 여유 (px). 중심 거리 기반 판정에 더해 체감 클릭률을 높임 */
export const TOLERANCE = 15;

/**
 * 방울 반지름 계산식: base = RADIUS_BASE + size × RADIUS_FACTOR
 * 실제 radius = base + random() × base × RADIUS_JITTER
 */
export const RADIUS_BASE = 2;
export const RADIUS_FACTOR = 1.4;
export const RADIUS_JITTER = 0.3;

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
