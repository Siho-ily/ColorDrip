import type { State } from '@/types/state';
import type { Bubble } from '@/types/bubble';
import RainCanvas from './layout/RainCanvas';
import BubbleLayer from './layout/BubbleLayer';

export default class Canvas {
    private rainCanvas: RainCanvas;
    private bubbleLayer: BubbleLayer;
    state?: State;

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

        this.bubbleLayer = new BubbleLayer({ $target: $el, initState: this.state });
        this.rainCanvas = new RainCanvas({ $target: $el, initState: this.state, onBubbleCatch });

        this.render();
    }

    setState(nextState: State) {
        this.state = { ...this.state, ...nextState };
        this.bubbleLayer.setState(this.state);
        this.rainCanvas.setState(this.state);
    }

    render() {
        this.bubbleLayer.render();
    }
}
