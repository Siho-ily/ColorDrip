import type { State } from "@/types/state";

export default class PaletteSidebar {
    private $el: HTMLDivElement;
    state?: State;

    constructor({ $target }: { $target: HTMLElement }) {
        this.$el = document.createElement('div');
        this.$el.className = 'absolute z-30';
        $target.appendChild(this.$el);
    }

    setState(nextState: State) {
        this.state = nextState;
        // 저장된 색상 목록 렌더링
    }
}
