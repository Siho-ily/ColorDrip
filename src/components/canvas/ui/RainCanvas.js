export default function RainCanvas({ $target, initState }) {
    const $el = document.createElement('canvas');
    $el.className = 'absolute inset-0 z-0 pointer-events-auto';
    $target.appendChild($el);

    this.state = initState;

    this.setState = (nextState) => {
        this.state = nextState;
        // matter-js 물리 루프 on/off
    };
}
