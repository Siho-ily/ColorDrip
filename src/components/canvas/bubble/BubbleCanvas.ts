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
    private reverseBodyMap = new Map<Matter.Body, number>();  // Matter.Body → bubble.id
    private pinnedIds = new Set<number>();  // 고정된 버블 id 목록 — unfreezeBubble이 고정을 해제하지 않도록 구분
    private width: number;
    private height: number;
    private mouse!: Matter.Mouse;
    private isMarqueeActive = false;
    private isDragFromOutside = false;

    constructor({
        $target,
        onPositionUpdate,
        onBubbleDragStart,
        onBubbleDragEnd,
    }: {
        $target: HTMLElement;
        onPositionUpdate: (updates: { id: number; x: number; y: number }[]) => void;
        onBubbleDragStart?: (id: number) => void;
        onBubbleDragEnd?: (id: number, x: number, y: number) => void;
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

        // document 기준으로 마우스 이벤트를 수신해야 팔레트 등 상위 z-index 요소 위에서도
        // 드래그가 끊기지 않는다. Canvas.$el이 inset-0이므로 좌표 오프셋은 동일.
        this.mouse = Mouse.create(document.documentElement);
        // Matter.js가 'wheel' 이벤트에 passive:false + preventDefault()를 걸어 페이지 스크롤을 막는다.
        // 드래그 물리에 wheel은 불필요하므로 제거한다. (matter.js build/matter.js:5896 참고)
        const _m = this.mouse as unknown as Record<string, EventListener>;
        document.documentElement.removeEventListener('wheel', _m['mousewheel']);

        // MouseConstraint.update는 engine.beforeUpdate마다 실행되며,
        // mouse.button === 0(눌림) + 미掴み 상태이면 마우스 위치의 body를 탐색해 잡는다.
        // marquee 드래그 중 버블이 의도치 않게 잡히는 버그를 막기 위해:
        // mousedown이 $target 밖에서 시작된 드래그는 MouseConstraint에서 제외한다.
        // (팔레트·메뉴바 등에서 드래그 시작 후 버블 위를 지날 때 버블이 끌려가는 버그 방지)
        document.addEventListener('mousedown', (e) => {
            this.isDragFromOutside = !$target.contains(e.target as Node);
        }, { capture: true });
        document.addEventListener('mouseup', () => {
            this.isDragFromOutside = false;
        }, { capture: true });

        // MouseConstraint.create가 자신의 beforeUpdate 리스너를 등록하기 전에
        // 우리 핸들러를 먼저 등록해 두면 매 틱마다 mouse.button을 -1로 덮어쓸 수 있다.
        Events.on(this.engine, 'beforeUpdate', () => {
            if (this.isMarqueeActive || this.isDragFromOutside) {
                this.mouse.button = -1;
            }
        });

        const mouseConstraint = MouseConstraint.create(this.engine, {
            mouse: this.mouse,
            constraint: { stiffness: 0.2, render: { visible: false } },
        });
        World.add(this.engine.world, mouseConstraint);

        // startdrag/enddrag: MouseConstraint가 body를 잡거나 놓을 때 발생.
        // reverseBodyMap으로 body → bubbleId를 역조회해 콜백에 id를 넘긴다.
        // 타입 정의의 IEvent<MouseConstraint>에 body가 없지만 런타임에는 포함된다.
        Events.on(mouseConstraint, 'startdrag', (e: any) => {
            const id = this.reverseBodyMap.get(e.body as Matter.Body);
            if (id !== undefined) onBubbleDragStart?.(id);
        });
        Events.on(mouseConstraint, 'enddrag', (e: any) => {
            const id = this.reverseBodyMap.get(e.body as Matter.Body);
            if (id !== undefined) onBubbleDragEnd?.(id, this.mouse.position.x, this.mouse.position.y);
        });

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
        Body.setInertia(body, Infinity); // 충돌 시 회전 방지
        Body.setVelocity(body, {
            x: bubble.velocity.x * BUBBLE_VELOCITY_SCALE,
            y: bubble.velocity.y * BUBBLE_VELOCITY_SCALE,
        });
        this.bodyMap.set(bubble.id, body);
        this.reverseBodyMap.set(body, bubble.id);
        World.add(this.engine.world, body);
    }

    removeBubble(id: number) {
        const body = this.bodyMap.get(id);
        if (!body) return;
        World.remove(this.engine.world, body);
        this.bodyMap.delete(id);
        this.reverseBodyMap.delete(body);
        this.pinnedIds.delete(id);
    }

    resizeBubble(id: number, newRadius: number) {
        const body = this.bodyMap.get(id);
        if (!body) return;
        const pos = { ...body.position };
        const vel = { ...body.velocity };
        const isStatic = body.isStatic;
        World.remove(this.engine.world, body);
        const newBody = Bodies.circle(pos.x, pos.y, newRadius, {
            restitution: BUBBLE_RESTITUTION,
            friction: 0,
            frictionAir: BUBBLE_FRICTION_AIR,
        });
        Body.setInertia(newBody, Infinity); // 충돌 시 회전 방지
        if (isStatic) {
            Body.setStatic(newBody, true);
        } else {
            Body.setVelocity(newBody, vel);
        }
        this.bodyMap.set(id, newBody);
        this.reverseBodyMap.delete(body);
        this.reverseBodyMap.set(newBody, id);
        World.add(this.engine.world, newBody);
    }

    /** marquee 드래그 중 MouseConstraint가 버블을 의도치 않게 잡는 현상 방지 */
    setMarqueeActive(active: boolean) {
        this.isMarqueeActive = active;
    }

    freezeBubble(id: number) {
        const body = this.bodyMap.get(id);
        if (!body) return;
        Body.setStatic(body, true);
    }

    /** 컨텍스트 메뉴 닫힘 등 일시적 고정 해제. 핀 고정 중인 버블은 건드리지 않는다. */
    unfreezeBubble(id: number) {
        if (this.pinnedIds.has(id)) return;
        const body = this.bodyMap.get(id);
        if (!body) return;
        Body.setStatic(body, false);
    }

    /** 사용자가 명시적으로 고정 — 컨텍스트 메뉴 닫혀도 static 유지 */
    pinBubble(id: number) {
        this.pinnedIds.add(id);
        const body = this.bodyMap.get(id);
        if (!body) return;
        Body.setStatic(body, true);
    }

    unpinBubble(id: number) {
        this.pinnedIds.delete(id);
        const body = this.bodyMap.get(id);
        if (!body) return;
        Body.setStatic(body, false);
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
