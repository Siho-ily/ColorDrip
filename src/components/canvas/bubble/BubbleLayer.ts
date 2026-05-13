import type { Bubble } from '@/types/bubble';

/**
 * 버블의 시각적 렌더링을 담당하는 DOM 레이어.
 *
 * - BubbleCanvas(물리)에서 매 프레임 위치를 받아 transform으로 갱신 (layout 재계산 없음)
 * - addBubble / removeBubble로 증분 DOM 관리 — 전체 재생성 없음
 * - 컨테이너: pointer-events: none / 개별 버블 div: pointer-events: auto
 */
export default class BubbleLayer {
    private $el: HTMLDivElement;
    private bubbleMap = new Map<number, { $el: HTMLDivElement; radius: number }>();

    constructor({ $target }: { $target: HTMLElement }) {
        this.$el = document.createElement('div');
        this.$el.className = 'absolute inset-0 pointer-events-none';
        $target.appendChild(this.$el);
    }

    addBubble(bubble: Bubble) {
        const $div = document.createElement('div');
        $div.className = 'absolute top-0 left-0 rounded-full pointer-events-auto';
        $div.style.width = `${bubble.radius * 2}px`;
        $div.style.height = `${bubble.radius * 2}px`;
        $div.style.backgroundColor = `hsl(${bubble.color.h}, ${bubble.color.s}%, ${bubble.color.l}%)`;
        $div.style.transform = `translate(${bubble.position.x - bubble.radius}px, ${bubble.position.y - bubble.radius}px)`;

        this.bubbleMap.set(bubble.id, { $el: $div, radius: bubble.radius });
        this.$el.appendChild($div);
    }

    removeBubble(id: number) {
        const entry = this.bubbleMap.get(id);
        if (!entry) return;
        entry.$el.remove();
        this.bubbleMap.delete(id);
    }

    syncPositions(updates: { id: number; x: number; y: number }[]) {
        updates.forEach(({ id, x, y }) => {
            const entry = this.bubbleMap.get(id);
            if (!entry) return;
            entry.$el.style.transform = `translate(${x - entry.radius}px, ${y - entry.radius}px)`;
        });
    }
}
