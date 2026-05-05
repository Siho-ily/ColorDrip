import type { State } from "@/types/state";
import RainCanvas from './ui/RainCanvas';
import BlobLayer from './ui/BlobLayer';

export default class Canvas {
    private rainCanvas: RainCanvas;
    private blobLayer: BlobLayer;
    state?: State;

    constructor({ $target }: { $target: HTMLElement }) {
        const $el = document.createElement('div');
        $el.className = 'absolute inset-0 z-10';
        $target.appendChild($el);

        this.rainCanvas = new RainCanvas({ $target: $el });
        this.blobLayer = new BlobLayer({ $target: $el });
    }

    setState(nextState: State) {
        this.state = nextState;
        this.rainCanvas.setState(nextState);
        this.blobLayer.setState(nextState);
    }
}
