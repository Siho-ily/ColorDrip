export default function BlobLayer({ $target, initState }) {
    const $el = document.createElement('div');
    $el.className = 'absolute inset-0 z-10 pointer-events-none';
    $target.appendChild($el);

    this.state = initState;

    this.setState = (nextState) => {
        this.state = nextState;
        // blobs[] 동기화
    };
}
