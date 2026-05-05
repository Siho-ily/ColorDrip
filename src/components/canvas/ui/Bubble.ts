import type { Bubble } from "@/types/bubble";

export default class BubbleUi {
    private $el: HTMLDivElement;
    private bubble: Bubble;

    constructor({ $target, initState }: { $target: HTMLElement, initState: Bubble }) {
        this.$el = document.createElement('div');
        this.$el.className = 'absolute rounded-full';
        $target.appendChild(this.$el);
        this.bubble = initState;
    }

    setState(bubble: Bubble) {
        this.bubble = bubble;
        this.render();
    }

    render() {
        this.$el.style.backgroundColor = `hsl(${this.bubble.color.h}, ${this.bubble.color.s}%, ${this.bubble.color.l}%)`;
        this.$el.style.width = `${this.bubble.radius * 2}px`;
        this.$el.style.height = `${this.bubble.radius * 2}px`;
        this.$el.style.left = `${this.bubble.position.x}px`;
        this.$el.style.top = `${this.bubble.position.y}px`;
    }
}