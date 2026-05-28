import type { State } from '@/types/state';
import type { Bubble, HslColor } from '@/types/bubble';
import RainCanvas from './rain/RainCanvas';
import BubbleCanvas from './bubble/BubbleCanvas';
import BubbleLayer from './bubble/BubbleLayer';
import SelectionLayer from './SelectionLayer';

/**
 * RainCanvas / BubbleCanvas / BubbleLayer를 조율하는 레이어.
 *
 * - RainCanvas: 빗방울 물리 + catch 감지
 * - BubbleCanvas: catch된 버블 물리 (충돌, 반사) — canvas 없음, 위치 콜백만 emit
 * - BubbleLayer: 버블 DOM 렌더링 — BubbleCanvas 위치 콜백을 받아 transform 갱신
 */
export default class Canvas {
    private $el: HTMLDivElement;
    private rainCanvas: RainCanvas;
    private bubbleCanvas: BubbleCanvas;
    private bubbleLayer: BubbleLayer;
    private selectionLayer: SelectionLayer;
    private state: State;
    private onBubbleCatch: (bubble: Bubble) => void;

    // Matter.js body id와 충돌하지 않도록 큰 값에서 시작
    private nextSpawnId = 1_000_000;

    constructor({
        $target,
        initState,
        onBubbleCatch,
        onBubbleClick,
        onBubbleContextMenu,
        onMarqueeEnd,
        onEmptyClick,
        onEmptyContextMenu,
    }: {
        $target: HTMLElement;
        initState: State;
        onBubbleCatch: (bubble: Bubble) => void;
        onBubbleClick: (id: number, additive: boolean) => void;
        onBubbleContextMenu: (id: number, bubbleRect: DOMRect, point: { x: number; y: number }) => void;
        onMarqueeEnd: (ids: number[], additive: boolean) => void;
        onEmptyClick: () => void;
        onEmptyContextMenu: (point: { x: number; y: number }) => void;
    }) {
        this.$el = document.createElement('div');
        this.$el.className = 'absolute inset-0 z-10 select-none';
        $target.appendChild(this.$el);

        this.state = { ...initState };
        this.onBubbleCatch = onBubbleCatch;

        this.bubbleLayer = new BubbleLayer({ $target: this.$el, onBubbleClick, onBubbleContextMenu });

        this.bubbleCanvas = new BubbleCanvas({
            $target: this.$el,
            onPositionUpdate: (updates) => this.bubbleLayer.syncPositions(updates),
        });

        this.selectionLayer = new SelectionLayer({
            getBubbleRects: () => this.bubbleLayer.getBubbleRects(),
            onMarqueeEnd: (ids, additive) => {
                this.bubbleCanvas.setMarqueeActive(false);
                onMarqueeEnd(ids, additive);
            },
            onEmptyClick: () => {
                this.bubbleCanvas.setMarqueeActive(false);
                onEmptyClick();
            },
        });

        this.rainCanvas = new RainCanvas({
            $target: this.$el,
            initState: this.state,
            onBubbleCatch: (bubble) => {
                this.bubbleLayer.addBubble(bubble);
                this.bubbleCanvas.addBubble(bubble);
                onBubbleCatch(bubble);
            },
            onEmptyPointerDown: (e) => {
                // 우클릭은 contextmenu 이벤트에서 처리 — marquee를 시작하면
                // pointerup에서 onEmptyClick이 호출되어 선택이 해제된다.
                if (e.button === 2) return;
                this.bubbleCanvas.setMarqueeActive(true);
                this.selectionLayer.startMarquee(e);
            },
            onEmptyContextMenu: (e) => onEmptyContextMenu({ x: e.clientX, y: e.clientY }),
        });
    }

    freezeBubble(id: number) { this.bubbleCanvas.freezeBubble(id); }
    unfreezeBubble(id: number) { this.bubbleCanvas.unfreezeBubble(id); }

    /** 혼합 결과 버블을 우클릭 위치에 spring 애니메이션과 함께 생성 */
    spawnMixedBubble(color: HslColor, radius: number, position: { x: number; y: number }) {
        const bubble: Bubble = {
            id: ++this.nextSpawnId,
            name: null,
            color,
            radius,
            position,
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2,
            },
            state: 'floating',
        };
        this.bubbleLayer.addBubble(bubble, 'spring');
        this.bubbleCanvas.addBubble(bubble);
        this.onBubbleCatch(bubble);
    }

    /** 팔레트 슬롯 클릭 시 캔버스 빈 곳에 floating bubble을 popping 애니메이션과 함께 생성 */
    spawnBubble(color: HslColor) {
        const width = this.$el.clientWidth;
        const height = this.$el.clientHeight;

        const radius = 30;
        const margin = radius + 20;
        const x = margin + Math.random() * Math.max(0, width - margin * 2);
        const y = margin + Math.random() * Math.max(0, height - margin * 2);

        const bubble: Bubble = {
            id: ++this.nextSpawnId,
            name: null,
            color,
            radius,
            position: { x, y },
            velocity: {
                x: (Math.random() - 0.5) * 2,
                y: (Math.random() - 0.5) * 2,
            },
            state: 'floating',
        };

        this.bubbleLayer.addBubble(bubble, 'pop');
        this.bubbleCanvas.addBubble(bubble);
        this.onBubbleCatch(bubble);
    }

    setState(nextState: State) {
        const prev = this.state;
        this.state = { ...this.state, ...nextState };
        this.rainCanvas.setState(this.state);

        // state에서 제거된 bubble → 물리 + DOM 양쪽에서 제거
        const nextIds = new Set(this.state.bubbles.map(b => b.id));
        prev.bubbles.forEach(b => {
            if (!nextIds.has(b.id)) {
                this.bubbleCanvas.removeBubble(b.id);
                this.bubbleLayer.removeBubble(b.id);
            }
        });

        if (prev.selectedBubbleIds !== this.state.selectedBubbleIds) {
            this.bubbleLayer.syncSelection(new Set(this.state.selectedBubbleIds));
        }
    }
}
