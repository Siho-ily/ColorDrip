import Matter from 'matter-js';
import type { HslColor } from '@/types/bubble';

function hslToCss({ h, s, l }: HslColor) {
    return `hsl(${h}, ${s}%, ${l}%)`;
}

// 물방울 SVG 경로 — viewBox 0 0 164 245.6 기준.
// 위쪽이 뾰족하고 아래가 둥근 물방울 형태.
// 실효 바운딩박스: x 2~162 (너비 160), y 3.6~243.6 (높이 240)
const RAINDROP_SHAPE = new Path2D(
    'M82 3.6c-48.7 72-80 117-80 160.7s35.8 79.3 80 79.3s80-35.5 80-79.3S130.7 75.5 82 3.6Z',
);
const RAINDROP_PATH_WIDTH = 160;        // 바운딩박스 너비 (물리 반지름 * 2와 일치시킴)
const RAINDROP_PATH_CX   = 82;         // 원형 부분 중심 X
const RAINDROP_PATH_CY   = 164.3;      // 원형 부분 중심 Y (적도선 y좌표) — 물리 body 위치와 일치시킴
// 이 설정으로 둥근 아래 부분이 physics circle과 정확히 겹치고,
// 뾰족한 꼬리는 위쪽으로 약 2r 뻗어 올라간다.

/**
 * 물방울 실루엣을 canvas에 그리는 공유 함수.
 * RainDrop 인스턴스뿐 아니라 RainCanvas의 퇴장 애니메이션에서도 재사용한다.
 *
 * rotation: 라디안. 0 = 수직 낙하 자세(꼬리 위/구체 아래).
 *   양수일수록 시계 방향으로 회전하므로, velocity 기반으로 Math.atan2(vx, vy)를 넘기면
 *   진행 방향으로 자연스럽게 기울어진다.
 */
export function drawTeardrop(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    color: HslColor,
    rotation: number = 0,
) {
    const s = (r * 2) / RAINDROP_PATH_WIDTH;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.scale(s, s);
    ctx.translate(-RAINDROP_PATH_CX, -RAINDROP_PATH_CY);
    ctx.fillStyle = hslToCss(color);
    ctx.fill(RAINDROP_SHAPE);
    ctx.restore();
}

/** velocity 벡터로부터 빗방울 회전 각도 계산. vy=0이고 vx=0이면 0 반환.
 *  꼬리가 진행 반대 방향(위)을 향하도록 부호를 반전한다:
 *  오른쪽으로 이동(vx > 0)하면 반시계 회전(-) → 꼬리가 오른쪽 위로 기울어짐. */
export function rotationFromVelocity(vx: number, vy: number): number {
    if (vx === 0 && vy === 0) return 0;
    return -Math.atan2(vx, vy);
}

/** Matter.js body 하나와 그 시각 표현을 함께 관리하는 빗방울 단위 컴포넌트 */
export default class RainDrop {
    readonly body: Matter.Body;     // Matter.js 물리 body — RainCanvas가 world에 추가
    readonly color: HslColor;       // 빗방울 색상 — catch 시 Bubble로 전달됨
    /** lean 비율(vx/vy) 노이즈 성분. 바람 변경 시 개별 편차를 유지하기 위해 저장 */
    readonly noiseRatio: number;
    /** 낙하 y 속도 기준값. 바람·속도 변경 시 갱신되며, vx 재계산의 기준으로 사용 */
    vy: number;

    constructor({
        x,
        y,
        radius,
        color,
        vx,         // 수평 초기 속도 (vy * (ratio + noiseRatio))
        vy,         // 수직 초기 속도. 중력 대신 이 값으로 등속 낙하
        noiseRatio, // lean 비율 노이즈 성분. 바람 변경 시 재사용
    }: {
        x: number;
        y: number;
        radius: number;
        color: HslColor;
        vx: number;
        vy: number;
        noiseRatio: number;
    }) {
        this.color = color;
        this.noiseRatio = noiseRatio;
        this.vy = vy;

        this.body = Matter.Bodies.circle(x, y, radius, {
            frictionAir: 0,  // 공기 저항 제거 — 속도 감쇠 없이 등속 유지
            // 같은 음수 group끼리는 절대 충돌하지 않음 — 빗방울끼리 서로 통과시킨다
            collisionFilter: { group: -1 },
            // afterRender에서 직접 그리므로 Matter.js 기본 렌더는 투명하게
            render: { fillStyle: 'transparent', strokeStyle: 'transparent', lineWidth: 0 },
        });

        // 중력 없음(GRAVITY.y=0) + frictionAir=0 → 초기 속도가 변하지 않고 등속 낙하
        Matter.Body.setVelocity(this.body, { x: vx, y: vy });
    }

    /** 물리 body의 실제 반지름. Matter.js 내부 프로퍼티를 타입 캐스팅으로 읽음 */
    get radius() {
        return (this.body as Matter.Body & { circleRadius: number }).circleRadius;
    }

    /** RainCanvas의 afterRender 이벤트에서 매 프레임 호출된다 */
    draw(ctx: CanvasRenderingContext2D) {
        // 기울기는 실제 이동 벡터로 계산 — 방향(각도)은 wind로만 결정되어 speed와 무관하므로
        // 실제 velocity를 그대로 써도 speed가 기울기를 바꾸지 않는다
        drawTeardrop(
            ctx,
            this.body.position.x,
            this.body.position.y,
            this.radius,
            this.color,
            rotationFromVelocity(this.body.velocity.x, this.body.velocity.y),
        );
    }
}
