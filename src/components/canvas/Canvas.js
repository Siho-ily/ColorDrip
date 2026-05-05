import RainCanvas from './ui/RainCanvas.js';
import BlobLayer from './ui/BlobLayer.js';

export default function Canvas({ $target, initState }) {
    const $el = document.createElement('div');
    $el.className = 'absolute inset-0 z-10';
    $target.appendChild($el);

    this.state = initState;

    const rainCanvas = new RainCanvas({ $target: $el });
    const blobLayer = new BlobLayer({ $target: $el });

    this.setState = (nextState) => {
        this.state = nextState;
        rainCanvas.setState(nextState);
        blobLayer.setState(nextState);
    };

    if (initState) this.setState(initState);
}
