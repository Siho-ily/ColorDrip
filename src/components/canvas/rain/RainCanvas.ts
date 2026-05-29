import Matter from 'matter-js';
import type { State } from '@/types/state';
import type { Bubble, HslColor } from '@/types/bubble';
import RainDrop, { drawTeardrop, rotationFromVelocity } from './RainDrop';
import {
    GRAVITY,
    TOLERANCE,
    radiusFromSize,
    DENSITY_INTERVAL_BASE,
    DROP_SATURATION,
    DROP_LIGHTNESS,
    CLEANUP_INTERVAL,
    OFFSCREEN_MARGIN,
    DROP_SPEED_FACTOR,
    DROP_SPEED_NOISE,
    DROP_DIRECTION_NOISE,
} from '@/data/constants';

const { Engine, Render, Runner, Composite, World, Events } = Matter;

function randomHsl(): HslColor {
    return {
        h: Math.random() * 360,
        s: DROP_SATURATION.min + Math.random() * DROP_SATURATION.range,
        l: DROP_LIGHTNESS.min + Math.random() * DROP_LIGHTNESS.range,
    };
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
    private onEmptyPointerDown: (e: PointerEvent) => void;
    private onEmptyContextMenu: (e: MouseEvent) => void;

    // body id → RainDrop. 클릭 감지 및 cleanup 시 color/radius 참조에 사용
    private drops = new Map<number, RainDrop>();

    // catch된 물방울의 퇴장 애니메이션 목록. 물리 body 제거 후에도 시각적으로 fade+shrink
    private exitingDrops: { x: number; y: number; radius: number; color: HslColor; rotation: number; startTime: number }[] = [];
    private static readonly EXIT_DURATION = 280; // ms

    constructor({
        $target,
        initState,
        onBubbleCatch,
        onEmptyPointerDown,
        onEmptyContextMenu,
    }: {
        $target: HTMLElement;
        initState: State;
        onBubbleCatch: (bubble: Bubble) => void;
        onEmptyPointerDown: (e: PointerEvent) => void;
        onEmptyContextMenu: (e: MouseEvent) => void;
    }) {
        this.state = { ...initState };
        this.onBubbleCatch = onBubbleCatch;
        this.onEmptyPointerDown = onEmptyPointerDown;
        this.onEmptyContextMenu = onEmptyContextMenu;

        const width = $target.clientWidth;
        const height = $target.clientHeight;

        this.engine = Engine.create({ gravity: GRAVITY });

        // wireframes 끄고 배경 투명 — BackgroundLayer가 배경을 담당
        this.render = Render.create({
            element: $target,
            engine: this.engine,
            options: { width, height, wireframes: false, background: 'transparent' },
        });

        // 경계 없음 — 화면 밖으로 나가면 cleanupInterval에서 제거

        // Matter.js가 프레임을 그린 뒤 각 RainDrop을 덮어씀.
        // 퇴장 중인 물방울(exitingDrops)도 여기서 fade+shrink 처리한다.
        Events.on(this.render, 'afterRender', () => {
            const ctx = this.render.context;
            const now = performance.now();

            this.drops.forEach(drop => drop.draw(ctx));

            // 잡힌 물방울: 크기를 줄이면서 fade-out
            this.exitingDrops = this.exitingDrops.filter(e => {
                const t = (now - e.startTime) / RainCanvas.EXIT_DURATION;
                if (t >= 1) return false;
                ctx.save();
                ctx.globalAlpha = 1 - t;                // 선형 페이드
                drawTeardrop(ctx, e.x, e.y, e.radius * (1 - t), e.color, e.rotation);  // 선형 축소
                ctx.restore();
                return true;
            });
        });

        // pointerdown을 써야 click(mouseup 기준)보다 100–200ms 빠르게 감지된다.
        // click 이벤트를 쓰면 그 사이에 body가 아래로 이동해 시각 위치와 physics 위치가 어긋난다.
        this.render.canvas.addEventListener('pointerdown', (e: PointerEvent) => {
            const point = { x: e.offsetX, y: e.offsetY };

            // Query.point는 body 경계를 정확히 검사해 체감 클릭 영역이 좁다.
            // 중심 거리 기반으로 직접 검사하고 tolerance를 더해 클릭 인식률을 높인다.
            const hit = Composite.allBodies(this.engine.world)
                .filter(b => !b.isStatic)
                .find(b => {
                    const drop = this.drops.get(b.id);
                    if (!drop) return false;
                    const dx = b.position.x - point.x;
                    const dy = b.position.y - point.y;
                    return dx * dx + dy * dy <= (drop.radius + TOLERANCE) ** 2;
                });
            if (!hit) {
                this.onEmptyPointerDown(e);
                return;
            }

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

            // 퇴장 애니메이션: 현재 위치/크기/색상/회전각을 캡처해 exitingDrops에 등록
            this.exitingDrops.push({
                x: hit.position.x,
                y: hit.position.y,
                radius: drop.radius,
                color: drop.color,
                rotation: rotationFromVelocity(hit.velocity.x, hit.velocity.y),
                startTime: performance.now(),
            });

            // body를 world에서 제거해 물리 루프에서 완전히 분리하고,
            // drops 맵에서도 삭제해 cleanupInterval과 afterRender에서 참조되지 않도록 한다
            World.remove(this.engine.world, hit);
            this.drops.delete(hit.id);
        });

        // 빈 공간(빗방울 포함)에서 우클릭 시 브라우저 기본 메뉴 차단 + 콜백.
        // 빗방울 우클릭은 별도 정의된 동작이 없으므로 동일하게 처리한다.
        this.render.canvas.addEventListener('contextmenu', (e: MouseEvent) => {
            e.preventDefault();
            this.onEmptyContextMenu(e);
        });

        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        // 화면 밖 body 정리 (매번 canvas 크기를 다시 읽어 resize 대응)
        this.cleanupInterval = setInterval(() => {
            this.removeOffscreen(this.render.canvas.width, this.render.canvas.height);
        }, CLEANUP_INTERVAL);

        // $target 크기 변화 → canvas 크기 동기화
        // 생성 시 캡처한 width/height 대신 매번 실시간 크기를 사용해야 resize 후 영역이 맞음
        // rAF로 감싸야 "ResizeObserver loop" 경고를 막을 수 있다.
        // 콜백 안에서 canvas 크기를 바꾸면 $target이 다시 resize되어 재진입이 발생하는데,
        // rAF로 다음 프레임에 실행하면 현재 알림 사이클과 분리된다.
        new ResizeObserver(entries => {
            requestAnimationFrame(() => {
                const { width: w, height: h } = entries[0].contentRect;
                this.render.canvas.width = w;
                this.render.canvas.height = h;
                this.render.options.width = w;
                this.render.options.height = h;
            });
        }).observe($target);

        if (initState.rainMode) this.startRain();
    }

    setState(nextState: State) {
        const prev = this.state;
        this.state = { ...this.state, ...nextState };

        // 바람이 바뀌면 기존 drops의 x 속도를 즉시 교체 — 개별 noiseX·vy는 유지
        const prevWind = prev.settings.rain.wind;
        const newWind = this.state.settings.rain.wind;
        if (prevWind !== newWind) {
            this.drops.forEach(drop => {
                Matter.Body.setVelocity(drop.body, { x: newWind + drop.noiseX, y: drop.vy });
            });
        }

        const densityChanged = prev.settings.rain.density !== this.state.settings.rain.density;
        if (this.state.rainMode && (!prev.rainMode || densityChanged)) {
            this.stopRain();
            this.startRain();
        } else if (!this.state.rainMode && prev.rainMode) {
            this.stopRain();
        }
    }

    private startRain() {
        if (this.rainInterval !== null) return;

        // density(1–20) → 생성 간격(ms). 높을수록 자주 생성
        const interval = Math.round(DENSITY_INTERVAL_BASE / this.state.settings.rain.density);

        this.rainInterval = setInterval(() => {
            // resize 대응: 매 틱마다 현재 캔버스 크기를 읽음
            const width = this.render.canvas.width;
            const height = this.render.canvas.height;
            const radius = radiusFromSize(this.state.settings.rain.size);
            const windX = this.state.settings.rain.wind;

            // 기저 속도 계산 + 방울마다 노이즈 적용
            const baseSpeedY = this.state.settings.rain.speed * DROP_SPEED_FACTOR;
            const noiseX = (Math.random() * 2 - 1) * DROP_DIRECTION_NOISE;
            const vy = baseSpeedY * (1 + (Math.random() * 2 - 1) * DROP_SPEED_NOISE);
            const vx = windX + noiseX;

            // 생성 위치: |windX| / (|windX| + baseSpeedY) 확률로 바람 불어오는 쪽 가장자리, 나머지는 위쪽
            const absWind = Math.abs(windX);
            const sideProbability = absWind / (absWind + baseSpeedY);
            let x: number, y: number;
            if (windX !== 0 && Math.random() < sideProbability) {
                x = windX > 0 ? -radius : width + radius;
                y = Math.random() * height;
            } else {
                x = -radius + Math.random() * (width + radius * 2);
                y = -radius * 2;
            }

            const drop = new RainDrop({ x, y, radius, color: randomHsl(), vx, vy, noiseX });
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
            if (y > height + OFFSCREEN_MARGIN.bottom || x < -OFFSCREEN_MARGIN.side || x > width + OFFSCREEN_MARGIN.side) {
                World.remove(this.engine.world, drop.body);
                this.drops.delete(id);
            }
        });
    }
}
