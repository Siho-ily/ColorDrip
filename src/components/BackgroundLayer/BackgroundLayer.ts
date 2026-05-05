import type { State } from "@/types/state";

export default class BackgroundLayer {
    private $el: HTMLDivElement;
    state?: State;

    constructor({ $target }: { $target: HTMLElement }) {
        this.$el = document.createElement('div');
        this.$el.className = 'absolute inset-0 z-0 bg-background';
        $target.appendChild(this.$el);
    }

    setState(nextState: State) {
        this.state = nextState;
    }
}
