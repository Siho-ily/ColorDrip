import type { State } from "@/types/state";

export default class RainCanvas {
    private $el: HTMLCanvasElement;
    state?: State;

    constructor({ $target }: { $target: HTMLElement }) {
        this.$el = document.createElement('canvas');
        this.$el.className = 'absolute inset-0 z-0 pointer-events-auto';
        $target.appendChild(this.$el);
    }

    setState(nextState: State) {
        this.state = nextState;
        // matter-js 물리 루프 on/off
    }
}
