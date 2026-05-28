import { animate as motionAnimate } from 'motion';
import type { Bubble } from '@/types/bubble';
import type { ColorNotation } from '@/types/settings';
import { formatColor } from '@/lib/color';
import { showTooltip, hideTooltip, moveTooltip } from '@/components/global/ui/ColorTooltip';

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
    private readonly onBubbleClick: (id: number, additive: boolean) => void;
    private readonly onBubbleContextMenu: (id: number, bubbleRect: DOMRect, point: { x: number; y: number }) => void;
    private readonly getColorNotation: () => ColorNotation;

    constructor({
        $target,
        onBubbleClick,
        onBubbleContextMenu,
        getColorNotation,
    }: {
        $target: HTMLElement;
        onBubbleClick: (id: number, additive: boolean) => void;
        onBubbleContextMenu: (id: number, bubbleRect: DOMRect, point: { x: number; y: number }) => void;
        getColorNotation: () => ColorNotation;
    }) {
        this.onBubbleClick = onBubbleClick;
        this.onBubbleContextMenu = onBubbleContextMenu;
        this.getColorNotation = getColorNotation;
        this.$el = document.createElement('div');
        this.$el.className = 'absolute inset-0 pointer-events-none';
        $target.appendChild(this.$el);
    }

    addBubble(bubble: Bubble, animate?: 'pop' | 'spring') {
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
        } else if (animate === 'spring') {
            // 초기 상태를 inline style로 고정해 첫 프레임 깜빡임 방지.
            // transform도 scale(0)으로 설정해야 motion이 현재 값을 올바르게 읽는다.
            $inner.style.opacity = '0';
            $inner.style.transform = 'scale(0)';
        }
        $outer.appendChild($inner);

        // 드래그가 끝난 mouseup은 click을 발생시키지 않는다 (브라우저 기본).
        // 짧은 클릭만 선택으로 처리된다.
        $outer.addEventListener('click', (e) => {
            this.onBubbleClick(bubble.id, e.shiftKey);
        });

        $outer.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.onBubbleContextMenu(bubble.id, $outer.getBoundingClientRect(), { x: e.clientX, y: e.clientY });
        });

        // hover 시 표기 방식에 맞춰 색상 코드 표시
        $outer.addEventListener('pointerenter', (e) => {
            showTooltip(formatColor(bubble.color, this.getColorNotation()), e.clientX, e.clientY);
        });
        $outer.addEventListener('pointermove', (e) => moveTooltip(e.clientX, e.clientY));
        $outer.addEventListener('pointerleave', () => hideTooltip());

        this.bubbleMap.set(bubble.id, { $el: $outer, radius: bubble.radius });
        this.$el.appendChild($outer);

        if (animate === 'spring') {
            // rAF로 한 프레임 뒤에 호출해 브라우저가 초기 상태를 paint한 후 애니메이션 시작.
            // single target(scale: 1)으로 지정하면 spring 물리가 자연스럽게 overshoot(~1.15)을
            // 만들어주므로 중간 keyframe을 명시할 필요가 없다.
            requestAnimationFrame(() => {
                motionAnimate(
                    $inner,
                    { scale: 1, opacity: 1 },
                    { type: 'spring', stiffness: 400, damping: 17, mass: 0.8 },
                );
            });
        }
    }

    removeBubble(id: number) {
        const entry = this.bubbleMap.get(id);
        if (!entry) return;
        entry.$el.remove();
        this.bubbleMap.delete(id);
    }

    resizeBubble(id: number, newRadius: number) {
        const entry = this.bubbleMap.get(id);
        if (!entry) return;
        entry.$el.style.width = `${newRadius * 2}px`;
        entry.$el.style.height = `${newRadius * 2}px`;
        entry.radius = newRadius;
    }

    syncPositions(updates: { id: number; x: number; y: number }[]) {
        updates.forEach(({ id, x, y }) => {
            const entry = this.bubbleMap.get(id);
            if (!entry) return;
            entry.$el.style.transform = `translate(${x - entry.radius}px, ${y - entry.radius}px)`;
        });
    }

    syncSelection(ids: Set<number>) {
        this.bubbleMap.forEach((entry, id) => {
            entry.$el.classList.toggle('bubble-selected', ids.has(id));
        });
    }

    /** marquee 교차 판정용 — id → viewport 기준 DOMRect */
    getBubbleRects(): Map<number, DOMRect> {
        const result = new Map<number, DOMRect>();
        this.bubbleMap.forEach((entry, id) => {
            result.set(id, entry.$el.getBoundingClientRect());
        });
        return result;
    }
}
