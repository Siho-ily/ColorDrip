import type { State } from '@/types/state';
import type { Bubble } from '@/types/bubble';
import RainCanvas from './rain/RainCanvas';
import BubbleLayer from './bubble/BubbleLayer';

/**
 * RainCanvas와 BubbleLayer를 묶는 조율 레이어.
 *
 * - RainCanvas: Matter.js 물리 엔진, 빗방울 낙하
 * - BubbleLayer: catch 이후 DOM div로 floating 버블 렌더링
 *
 * 두 레이어가 같은 $el을 부모로 공유하므로 좌표계 변환 없이 위치가 맞아떨어진다.
 */
export default class Canvas {
    private rainCanvas: RainCanvas;
    // private bubbleLayer: BubbleLayer;
    state?: State;

    constructor({
        $target,
        initState,
        onBubbleCatch,  // 방울 클릭 시 App으로 catch 사실을 알리는 콜백
    }: {
        $target: HTMLElement;
        initState: State;
        onBubbleCatch: (bubble: Bubble) => void;
    }) {
        const $el = document.createElement('div');
        $el.className = 'absolute inset-0 z-10';
        $target.appendChild($el);

        this.state = { ...initState };

        // BubbleLayer를 먼저 마운트해 z-index 상 RainCanvas 위에 오게 함
        // this.bubbleLayer = new BubbleLayer({ $target: $el, initState: this.state });
        this.rainCanvas = new RainCanvas({ $target: $el, initState: this.state, onBubbleCatch });

        this.render();
    }

    setState(nextState: State) {
        this.state = { ...this.state, ...nextState };
        // this.bubbleLayer.setState(this.state);
        this.rainCanvas.setState(this.state);
    }

    render() {
        // this.bubbleLayer.render();
        // RainCanvas는 Matter.js 루프가 직접 렌더링을 담당 — 여기서 호출 불필요
    }
}
