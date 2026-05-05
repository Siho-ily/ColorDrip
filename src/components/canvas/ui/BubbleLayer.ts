import type { State } from "@/types/state";

export default class BubbleLayer {
    private $el: HTMLDivElement;
    state?: State;

    constructor({ $target }: { $target: HTMLElement }) {
        this.$el = document.createElement('div');
        this.$el.className = 'absolute inset-0 z-10 pointer-events-none';
        $target.appendChild(this.$el);
    }

    setState(nextState: State) {
        this.state = nextState;
        // bubbles[] 동기화
    }
}
