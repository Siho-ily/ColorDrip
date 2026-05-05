import Matter from 'matter-js';
import type { State } from '@/types/state';
import type { Bubble, HslColor } from '@/types/bubble';
import RainDrop from '../ui/RainDrop';

const { Engine, Render, Runner, Composite, Query, World, Events } = Matter;

// 사선 낙하 각도 (오른쪽 방향으로 기울어진 바람)
const WIND_X = 2.5;

function randomHsl(): HslColor {
    return { h: Math.random() * 360, s: 70 + Math.random() * 30, l: 50 + Math.random() * 15 };
}

export default class RainCanvas {
    private engine: Matter.Engine;
    private render: Matter.Render;
    private runner: Matter.Runner;
    private rainInterval: ReturnType<typeof setInterval> | null = null;
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;
    private state: State;
    private onBubbleCatch: (bubble: Bubble) => void;

    // body id → RainDrop 인스턴스. catch / cleanup 시 참조
    private drops = new Map<number, RainDrop>();

    constructor({
        $target,
        initState,
        onBubbleCatch,
    }: {
        $target: HTMLElement;
        initState: State;
        onBubbleCatch: (bubble: Bubble) => void;
    }) {
        this.state = { ...initState };
        this.onBubbleCatch = onBubbleCatch;

        const width = $target.clientWidth;
        const height = $target.clientHeight;

        this.engine = Engine.create();

        this.render = Render.create({
            element: $target,
            engine: this.engine,
            options: {
                width,
                height,
                wireframes: false,
                background: 'transparent',
            },
        });

        // 경계 없음 — 화면 밖으로 나가면 removeOffscreen에서 정리

        // 각 RainDrop의 draw()를 afterRender마다 호출
        Events.on(this.render, 'afterRender', () => {
            const ctx = this.render.context;
            this.drops.forEach(drop => drop.draw(ctx));
        });

        // 클릭한 위치의 body를 catch
        this.render.canvas.addEventListener('click', (e: MouseEvent) => {
            const point = { x: e.offsetX, y: e.offsetY };
            const hit = Query.point(Composite.allBodies(this.engine.world), point)
                .find(b => !b.isStatic);
            if (!hit) return;

            const drop = this.drops.get(hit.id);
            if (!drop) return;

            const bubble: Bubble = {
                id: hit.id,
                name: null,
                color: drop.color,
                radius: drop.radius,
                position: { x: hit.position.x, y: hit.position.y },
                velocity: { x: hit.velocity.x, y: hit.velocity.y },
                state: 'catching',
            };

            this.onBubbleCatch(bubble);
        });

        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        this.cleanupInterval = setInterval(() => {
            this.removeOffscreen(this.render.canvas.width, this.render.canvas.height);
        }, 3000);

        new ResizeObserver(entries => {
            const { width: w, height: h } = entries[0].contentRect;
            this.render.canvas.width = w;
            this.render.canvas.height = h;
            this.render.options.width = w;
            this.render.options.height = h;
        }).observe($target);

        if (initState.rainMode) this.startRain();
    }

    setState(nextState: State) {
        const prev = this.state;
        this.state = { ...this.state, ...nextState };

        if (!prev.rainMode && this.state.rainMode) this.startRain();
        else if (prev.rainMode && !this.state.rainMode) this.stopRain();
    }

    private startRain() {
        if (this.rainInterval !== null) return;

        const interval = Math.round(2000 / this.state.settings.rain.density);

        this.rainInterval = setInterval(() => {
            const width = this.render.canvas.width;
            const radius = 12 + Math.random() * 8;
            const x = -radius + Math.random() * (width + radius * 2);

            const drop = new RainDrop({
                x,
                y: -radius * 2,
                radius,
                color: randomHsl(),
                gravityScale: this.state.settings.rain.speed / 10,
                windX: WIND_X,
            });

            this.drops.set(drop.body.id, drop);
            World.add(this.engine.world, drop.body);
        }, interval);
    }

    private stopRain() {
        if (this.rainInterval === null) return;
        clearInterval(this.rainInterval);
        this.rainInterval = null;
    }

    private removeOffscreen(width: number, height: number) {
        this.drops.forEach((drop, id) => {
            const { x, y } = drop.body.position;
            if (y > height + 100 || x < -200 || x > width + 200) {
                World.remove(this.engine.world, drop.body);
                this.drops.delete(id);
            }
        });
    }
}
