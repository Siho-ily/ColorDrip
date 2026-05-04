export default function BackgroundLayer({ $target, initState }) {
    const $el = document.createElement('div');
    $el.className = 'absolute inset-0 z-0 bg-background';
    $target.appendChild($el);

    this.state = initState;

    this.setState = (nextState) => {
        this.state = nextState;
    };
}
