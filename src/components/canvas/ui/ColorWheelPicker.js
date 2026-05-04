export default function ColorWheelPicker({ $target, initState }) {
    const $el = document.createElement('div');
    $el.className = 'absolute z-20 hidden';
    $target.appendChild($el);

    this.state = initState;

    this.setState = (nextState) => {
        this.state = nextState;
        // blob 클릭 시 위치 설정 및 표시/숨김
    };
}
