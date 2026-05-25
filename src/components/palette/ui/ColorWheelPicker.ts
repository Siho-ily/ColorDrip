import type { State } from "@/types/state";

export default class ColorWheelPicker {
    private $el: HTMLDivElement;
    state?: State;

    constructor({ $target }: { $target: HTMLElement }) {
        this.$el = document.createElement('div');
        this.$el.className = 'absolute z-20 hidden';
        $target.appendChild(this.$el);
    }

    setState(nextState: State) {
        this.state = nextState;
        // blob 클릭 시 위치 설정 및 표시/숨김
    }
}
