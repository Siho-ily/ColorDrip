export default function PaletteSidebar({ $target, initState }) {
    const $el = document.createElement('div');
    $el.className = 'absolute z-30';
    $target.appendChild($el);

    this.state = initState;

    this.setState = (nextState) => {
        this.state = nextState;
        // 저장된 색상 목록 렌더링
    };
}
