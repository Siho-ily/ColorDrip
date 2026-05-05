import Matter from 'matter-js';
import type { HslColor } from '@/types/bubble';

function hslToCss({ h, s, l }: HslColor) {
    return `hsl(${h}, ${s}%, ${l}%)`;
}

export default class RainDrop {
    readonly body: Matter.Body;
    readonly color: HslColor;

    constructor({
        x,
        y,
        radius,
        color,
        gravityScale,
        windX,
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

        Matter.Body.setVelocity(this.body, { x: windX, y: 0 });
    }

    get radius() {
        return (this.body as Matter.Body & { circleRadius: number }).circleRadius;
    }

    /**
     * 진행 방향을 향한 정삼각형을 그린다.
     * RainCanvas의 afterRender 이벤트에서 호출된다.
     */
    draw(ctx: CanvasRenderingContext2D) {
        const { x, y } = this.body.position;
        const { x: vx, y: vy } = this.body.velocity;
        const r = this.radius;
        const angle = Math.atan2(vy, vx) - Math.PI / 2;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.lineTo(r * Math.sin(2 * Math.PI / 3), -r * Math.cos(2 * Math.PI / 3));
        ctx.lineTo(r * Math.sin(4 * Math.PI / 3), -r * Math.cos(4 * Math.PI / 3));
        ctx.closePath();

        ctx.fillStyle = hslToCss(this.color);
        ctx.fill();
        ctx.restore();
    }
}
