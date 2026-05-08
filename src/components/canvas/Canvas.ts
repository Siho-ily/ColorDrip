import type { State } from '@/types/state';
import type { Bubble } from '@/types/bubble';
import RainCanvas from './rain/RainCanvas';
import BubbleCanvas from './bubble/BubbleCanvas';
import BubbleLayer from './bubble/BubbleLayer';

/**
 * RainCanvas / BubbleCanvas / BubbleLayer를 조율하는 레이어.
 *
 * - RainCanvas: 빗방울 물리 + catch 감지
 * - BubbleCanvas: catch된 버블 물리 (충돌, 반사) — canvas 없음, 위치 콜백만 emit
 * - BubbleLayer: 버블 DOM 렌더링 — BubbleCanvas 위치 콜백을 받아 transform 갱신
 */
export default class Canvas {
    private rainCanvas: RainCanvas;
    private bubbleCanvas: BubbleCanvas;
    private bubbleLayer: BubbleLayer;
    private state: State;

    constructor({
        $target,
        initState,
        onBubbleCatch,
    }: {
        $target: HTMLElement;
        initState: State;
        onBubbleCatch: (bubble: Bubble) => void;
    }) {
        const $el = document.createElement('div');
        $el.className = 'absolute inset-0 z-10';
        $target.appendChild($el);

        this.state = { ...initState };

        this.bubbleLayer = new BubbleLayer({ $target: $el });

        this.bubbleCanvas = new BubbleCanvas({
            $target: $el,
            onPositionUpdate: (updates) => this.bubbleLayer.syncPositions(updates),
        });

        this.rainCanvas = new RainCanvas({
            $target: $el,
            initState: this.state,
            onBubbleCatch: (bubble) => {
                this.bubbleLayer.addBubble(bubble);
                this.bubbleCanvas.addBubble(bubble);
                onBubbleCatch(bubble);
            },
        });
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
    }
}
