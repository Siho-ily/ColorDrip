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
    private readonly onBubbleContextMenu: (id: number, bubbleRect: DOMRect) => void;

    constructor({
        $target,
        onBubbleContextMenu,
    }: {
        $target: HTMLElement;
        onBubbleContextMenu: (id: number, bubbleRect: DOMRect) => void;
    }) {
        this.onBubbleContextMenu = onBubbleContextMenu;
        this.$el = document.createElement('div');
        this.$el.className = 'absolute inset-0 pointer-events-none';
        $target.appendChild(this.$el);
    }

    addBubble(bubble: Bubble, animate?: 'pop') {
        // outer: 위치(translate) 담당. syncPositions가 매 프레임 갱신.
        // inner: 색상/모양/스케일 애니메이션 담당. transform 충돌 방지를 위해 분리.
        const $outer = document.createElement('div');
        $outer.className = 'absolute top-0 left-0 pointer-events-auto';
        $outer.style.width = `${bubble.radius * 2}px`;
        $outer.style.height = `${bubble.radius * 2}px`;
        $outer.style.transform = `translate(${bubble.position.x - bubble.radius}px, ${bubble.position.y - bubble.radius}px)`;

        const $inner = document.createElement('div');
        $inner.className = 'w-full h-full rounded-full';
        $inner.style.backgroundColor = `hsl(${bubble.color.h}, ${bubble.color.s}%, ${bubble.color.l}%)`;
        if (animate === 'pop') {
            $inner.style.animation = 'bubble-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }
        $outer.appendChild($inner);

        $outer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.onBubbleContextMenu(bubble.id, $outer.getBoundingClientRect());
        });

        this.bubbleMap.set(bubble.id, { $el: $outer, radius: bubble.radius });
        this.$el.appendChild($outer);
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
