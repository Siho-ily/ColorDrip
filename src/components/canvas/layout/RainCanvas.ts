import Matter from 'matter-js';
import type { State } from '@/types/state';
import type { Bubble, HslColor } from '@/types/bubble';
import RainDrop from '../ui/RainDrop';

const { Engine, Render, Runner, Composite, Query, World, Events } = Matter;

// 수평 초기 속도 — 모든 방울에 동일하게 적용해 바람 방향을 표현
const WIND_X = 2.5;

function randomHsl(): HslColor {
    return { h: Math.random() * 360, s: 70 + Math.random() * 30, l: 50 + Math.random() * 15 };
}

/**
 * Matter.js 물리 엔진 위에서 빗방울을 생성·관리하는 레이어.
 *
 * - 빗방울(RainDrop)을 주기적으로 생성해 world에 추가
 * - afterRender 이벤트에서 각 RainDrop의 draw()를 호출해 삼각형으로 시각화
 * - 클릭 시 해당 body를 Bubble로 변환해 onBubbleCatch 콜백으로 전달
 * - ResizeObserver로 canvas 크기를 $target에 항상 동기화
 * - 화면 밖으로 나간 body는 3초 주기로 제거
 */
export default class RainCanvas {
    private engine: Matter.Engine;
    private render: Matter.Render;
    private runner: Matter.Runner;
    private rainInterval: ReturnType<typeof setInterval> | null = null;     // 방울 생성 루프
    private cleanupInterval: ReturnType<typeof setInterval> | null = null;  // 화면 밖 body 정리
    private state: State;
    private onBubbleCatch: (bubble: Bubble) => void;

    // body id → RainDrop. 클릭 감지 및 cleanup 시 color/radius 참조에 사용
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

        // wireframes 끄고 배경 투명 — BackgroundLayer가 배경을 담당
        this.render = Render.create({
            element: $target,
            engine: this.engine,
            options: { width, height, wireframes: false, background: 'transparent' },
        });

        // 경계 없음 — 화면 밖으로 나가면 cleanupInterval에서 제거

        // Matter.js가 프레임을 그린 뒤 각 RainDrop을 삼각형으로 덮어씀
        Events.on(this.render, 'afterRender', () => {
            const ctx = this.render.context;
            this.drops.forEach(drop => drop.draw(ctx));
        });

        // 클릭 위치에 있는 body를 Bubble로 변환해 상위로 전달
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

        // 화면 밖 body 정리 (매번 canvas 크기를 다시 읽어 resize 대응)
        this.cleanupInterval = setInterval(() => {
            this.removeOffscreen(this.render.canvas.width, this.render.canvas.height);
        }, 3000);

        // $target 크기 변화 → canvas 크기 동기화
        // 생성 시 캡처한 width/height 대신 매번 실시간 크기를 사용해야 resize 후 영역이 맞음
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

        // rainMode 전환에만 반응 — 나머지 설정 변경은 다음 방울 생성 시 자동 반영
        if (!prev.rainMode && this.state.rainMode) this.startRain();
        else if (prev.rainMode && !this.state.rainMode) this.stopRain();
    }

    private startRain() {
        if (this.rainInterval !== null) return;

        // density(1–20) → 생성 간격(ms). 높을수록 자주 생성
        const interval = Math.round(2000 / this.state.settings.rain.density);

        this.rainInterval = setInterval(() => {
            // resize 대응: 매 틱마다 현재 캔버스 너비를 읽음
            const width = this.render.canvas.width;
            const radius = 12 + Math.random() * 8;
            // 사선으로 떨어지므로 왼쪽 바깥에서도 시작할 수 있게 범위 확장
            const x = -radius + Math.random() * (width + radius * 2);

            const drop = new RainDrop({
                x,
                y: -radius * 2,     // 캔버스 위쪽 바깥에서 시작
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

    /** 화면 밖으로 나간 body와 대응하는 RainDrop 인스턴스를 제거 */
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
