import type { State } from "@/types/state";

/**
 * floating/dragging/selected 상태의 버블을 DOM div로 렌더링하는 레이어.
 *
 * - RainCanvas와 같은 부모($target)를 공유해 좌표계가 동일
 * - 컨테이너 자체는 pointer-events: none, 개별 버블 div는 pointer-events: auto
 * - Matter.js body가 world에 살아있는 동안 매 setState마다 position을 동기화
 */
export default class BubbleLayer {
    private $el: HTMLDivElement;    // pointer-events: none 컨테이너
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
        // 매 render마다 전체 재생성 — 추후 bubble id 기반 diff로 최적화 가능
        this.$el.innerHTML = '';
        this.state?.bubbles.forEach(bubble => {
            const $bubble = document.createElement('div');
            $bubble.className = 'absolute rounded-full pointer-events-auto';
            $bubble.style.backgroundColor = `hsl(${bubble.color.h}, ${bubble.color.s}%, ${bubble.color.l}%)`;
            $bubble.style.width = `${bubble.radius * 2}px`;
            $bubble.style.height = `${bubble.radius * 2}px`;
            // position은 body 중심 좌표 — 좌상단 기준 CSS로 변환
            $bubble.style.left = `${bubble.position.x - bubble.radius}px`;
            $bubble.style.top = `${bubble.position.y - bubble.radius}px`;
            this.$el.appendChild($bubble);
        });
    }
}
