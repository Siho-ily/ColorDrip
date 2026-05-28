import Matter from 'matter-js';
import type { HslColor } from '@/types/bubble';
import { DROP_RESTITUTION } from '@/data/constants';

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
 */
export function drawTeardrop(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    color: HslColor,
) {
    const s = (r * 2) / RAINDROP_PATH_WIDTH;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.translate(-RAINDROP_PATH_CX, -RAINDROP_PATH_CY);
    ctx.fillStyle = hslToCss(color);
    ctx.fill(RAINDROP_SHAPE);
    ctx.restore();
}

/** Matter.js body 하나와 그 시각 표현을 함께 관리하는 빗방울 단위 컴포넌트 */
export default class RainDrop {
    readonly body: Matter.Body;     // Matter.js 물리 body — RainCanvas가 world에 추가
    readonly color: HslColor;       // 빗방울 색상 — catch 시 Bubble로 전달됨

    constructor({
        x,
        y,
        radius,
        color,
        gravityScale,   // speed 설정값 기반. 높을수록 빠르게 낙하
        windX,          // 수평 초기 속도. 사선 낙하 효과
    }: {
        x: number;
        y: number;
        radius: number;
        color: HslColor;
        gravityScale: number;
        windX: number;
    }) {
        this.color = color;

        this.body = Matter.Bodies.circle(x, y, radius, {
            restitution: DROP_RESTITUTION,
            // afterRender에서 직접 그리므로 Matter.js 기본 렌더는 투명하게
            render: { fillStyle: 'transparent', strokeStyle: 'transparent', lineWidth: 0 },
        });

        // gravityScale은 IBodyDefinition 타입에 없으므로 생성 후 직접 할당
        (this.body as Matter.Body & { gravityScale: number }).gravityScale = gravityScale;

        // 수평 속도만 부여 — 수직은 중력이 담당
        Matter.Body.setVelocity(this.body, { x: windX, y: 0 });
    }

    /** 물리 body의 실제 반지름. Matter.js 내부 프로퍼티를 타입 캐스팅으로 읽음 */
    get radius() {
        return (this.body as Matter.Body & { circleRadius: number }).circleRadius;
    }

    /** RainCanvas의 afterRender 이벤트에서 매 프레임 호출된다 */
    draw(ctx: CanvasRenderingContext2D) {
        drawTeardrop(ctx, this.body.position.x, this.body.position.y, this.radius, this.color);
    }
}
