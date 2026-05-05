import type { State } from "@/types/state";

export default class BubbleLayer {
    private $el: HTMLDivElement;
    state?: State;

    constructor({ $target, initState }: { $target: HTMLElement, initState: State }) {
        this.$el = document.createElement('div');
        this.$el.className = 'absolute inset-0 z-10 pointer-events-none';
        $target.appendChild(this.$el);

        this.state = { ...initState };

        this.render();
    }

    setState(nextState: State) {
        this.state = { ...this.state, ...nextState };
        this.render();
    }

    render() {
        this.$el.innerHTML = ''
        this.state?.bubbles.forEach(bubble => {
            const $bubble = document.createElement('div');
            $bubble.className = 'absolute rounded-full';
            $bubble.style.backgroundColor = `hsl(${bubble.color.h}, ${bubble.color.s}%, ${bubble.color.l}%)`;
            $bubble.style.width = `${bubble.radius * 2}px`;
            $bubble.style.height = `${bubble.radius * 2}px`;
            $bubble.style.left = `${bubble.position.x}px`;
            $bubble.style.top = `${bubble.position.y}px`;
            this.$el.appendChild($bubble);
        })
    }
}
