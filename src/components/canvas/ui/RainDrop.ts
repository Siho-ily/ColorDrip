import Matter from 'matter-js';
import type { HslColor } from '@/types/bubble';

function hslToCss({ h, s, l }: HslColor) {
    return `hsl(${h}, ${s}%, ${l}%)`;
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
            restitution: 0.3,
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
        const { x, y } = this.body.position;
        const r = this.radius;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = hslToCss(this.color);
        ctx.fill();
    }
}
