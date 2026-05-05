import type { State } from "@/types/state";
import RainCanvas from './ui/RainCanvas';
import BubbleLayer from './ui/BubbleLayer';

export default class Canvas {
    private rainCanvas: RainCanvas;
    private bubbleLayer: BubbleLayer;
    state?: State;

    constructor({ $target }: { $target: HTMLElement }) {
        const $el = document.createElement('div');
        $el.className = 'absolute inset-0 z-10';
        $target.appendChild($el);

        this.rainCanvas = new RainCanvas({ $target: $el });
        this.bubbleLayer = new BubbleLayer({ $target: $el });
    }

    setState(nextState: State) {
        this.state = nextState;
        this.rainCanvas.setState(nextState);
        this.bubbleLayer.setState(nextState);
    }
}
