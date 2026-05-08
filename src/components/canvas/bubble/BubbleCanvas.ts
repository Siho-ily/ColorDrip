import Matter from 'matter-js';
import type { Bubble } from '@/types/bubble';
import {
    BUBBLE_RESTITUTION,
    BUBBLE_FRICTION_AIR,
    BUBBLE_WALL_THICKNESS,
    BUBBLE_VELOCITY_SCALE,
} from '@/data/constants';

const { Engine, Runner, World, Bodies, Body, Events, Mouse, MouseConstraint } = Matter;

/**
 * catch된 버블들의 물리 시뮬레이션만 담당 — 렌더링은 BubbleLayer가 맡음.
 *
 * - 중력 없음, 4방향 벽, 버블끼리 충돌
 * - afterUpdate마다 onPositionUpdate 콜백으로 위치 전달 → BubbleLayer가 DOM 갱신
 * - Matter.Render를 쓰지 않아 canvas element 없음 (DOM에 아무것도 추가 안 함)
 */
export default class BubbleCanvas {
    private engine: Matter.Engine;
    private runner: Matter.Runner;
    private walls: Matter.Body[] = [];
    private bodyMap = new Map<number, Matter.Body>();  // bubble.id → Matter.Body
    private width: number;
    private height: number;

    constructor({
        $target,
        onPositionUpdate,
    }: {
        $target: HTMLElement;
        onPositionUpdate: (updates: { id: number; x: number; y: number }[]) => void;
    }) {
        this.engine = Engine.create({ gravity: { x: 0, y: 0 } });

        this.width = $target.clientWidth;
        this.height = $target.clientHeight;
        this.addWalls(this.width, this.height);

        Events.on(this.engine, 'afterUpdate', () => {
            if (this.bodyMap.size === 0) return;

            // tunneling 방지: 경계 밖으로 나간 body를 강제로 안으로 되돌림
            // velocity는 벽 쪽을 향할 때만 반전 — 이미 벗어나는 방향이면 건드리지 않음
            // (반전을 무조건 하면 Matter.js 벽 충돌과 충돌해서 달라붙는 버그 발생)
            this.bodyMap.forEach(body => {
                const r = body.circleRadius ?? 0;
                const { x, y } = body.position;
                const nx = Math.max(r, Math.min(this.width - r, x));
                const ny = Math.max(r, Math.min(this.height - r, y));
                if (nx === x && ny === y) return;

                Body.setPosition(body, { x: nx, y: ny });

                const vx = body.velocity.x;
                const vy = body.velocity.y;
                // (nx - x) * vx < 0 → 이동 방향이 벽 쪽 → 반전 필요
                Body.setVelocity(body, {
                    x: nx !== x && (nx - x) * vx < 0 ? -vx : vx,
                    y: ny !== y && (ny - y) * vy < 0 ? -vy : vy,
                });
            });

            const updates = [...this.bodyMap.entries()].map(([id, body]) => ({
                id,
                x: body.position.x,
                y: body.position.y,
            }));
            onPositionUpdate(updates);
        });

        // $target 기준 마우스 좌표 → 물리 세계 좌표와 동일 (같은 부모 공유)
        const mouse = Mouse.create($target);
        const mouseConstraint = MouseConstraint.create(this.engine, {
            mouse,
            constraint: { stiffness: 0.2, render: { visible: false } },
        });
        World.add(this.engine.world, mouseConstraint);

        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        new ResizeObserver(entries => {
            requestAnimationFrame(() => {
                const { width, height } = entries[0].contentRect;
                this.width = width;
                this.height = height;
                this.resizeWalls(width, height);
            });
        }).observe($target);
    }

    addBubble(bubble: Bubble) {
        const body = Bodies.circle(bubble.position.x, bubble.position.y, bubble.radius, {
            restitution: BUBBLE_RESTITUTION,
            friction: 0,
            frictionAir: BUBBLE_FRICTION_AIR,
        });
        Body.setVelocity(body, {
            x: bubble.velocity.x * BUBBLE_VELOCITY_SCALE,
            y: bubble.velocity.y * BUBBLE_VELOCITY_SCALE,
        });
        this.bodyMap.set(bubble.id, body);
        World.add(this.engine.world, body);
    }

    removeBubble(id: number) {
        const body = this.bodyMap.get(id);
        if (!body) return;
        World.remove(this.engine.world, body);
        this.bodyMap.delete(id);
    }

    private addWalls(width: number, height: number) {
        const opts = { isStatic: true, restitution: 1, friction: 0 };
        const t = BUBBLE_WALL_THICKNESS;
        this.walls = [
            Bodies.rectangle(width / 2,      -t / 2,         width + t * 2, t,      opts),  // top
            Bodies.rectangle(width / 2,      height + t / 2, width + t * 2, t,      opts),  // bottom
            Bodies.rectangle(-t / 2,         height / 2,     t,             height, opts),  // left
            Bodies.rectangle(width + t / 2,  height / 2,     t,             height, opts),  // right
        ];
        World.add(this.engine.world, this.walls);
    }

    private resizeWalls(width: number, height: number) {
        this.walls.forEach(wall => World.remove(this.engine.world, wall));
        this.addWalls(width, height);
    }
}
