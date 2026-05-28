/**
 * 빈 공간 드래그로 buble을 다중 선택하는 marquee 레이어.
 *
 * - RainCanvas의 빈 클릭(hit 없는 pointerdown)이 startMarquee로 들어온다
 * - window pointermove/up 리스너로 박스 갱신 + 종료 처리
 * - 드래그 거리 < THRESHOLD이면 빈 클릭으로 간주해 onEmptyClick emit
 * - 종료 시점에 getBubbleRects로 현재 버블 위치를 1회 쿼리해 교차 판정 → onMarqueeEnd
 */

const THRESHOLD = 4;  // px. 이 거리 미만이면 marquee가 아닌 빈 클릭으로 처리

export default class SelectionLayer {
    private $box: HTMLDivElement;
    private readonly getBubbleRects: () => Map<number, DOMRect>;
    private readonly onMarqueeEnd: (ids: number[], additive: boolean) => void;
    private readonly onEmptyClick: () => void;

    constructor({
        getBubbleRects,
        onMarqueeEnd,
        onEmptyClick,
    }: {
        getBubbleRects: () => Map<number, DOMRect>;
        onMarqueeEnd: (ids: number[], additive: boolean) => void;
        onEmptyClick: () => void;
    }) {
        this.getBubbleRects = getBubbleRects;
        this.onMarqueeEnd = onMarqueeEnd;
        this.onEmptyClick = onEmptyClick;

        this.$box = document.createElement('div');
        // viewport 기준 좌표를 그대로 쓰기 위해 fixed
        this.$box.className = 'fixed pointer-events-none z-40 hidden';
        this.$box.style.border = '1.5px dashed rgba(80, 80, 80, 0.8)';
        this.$box.style.background = 'rgba(120, 120, 120, 0.12)';
        this.$box.style.borderRadius = '2px';
        document.body.appendChild(this.$box);
    }

    startMarquee(downEvent: PointerEvent) {
        const x0 = downEvent.clientX;
        const y0 = downEvent.clientY;
        const additive = downEvent.shiftKey;
        let moved = false;

        const onMove = (e: PointerEvent) => {
            const dx = e.clientX - x0;
            const dy = e.clientY - y0;
            if (!moved && Math.hypot(dx, dy) < THRESHOLD) return;
            moved = true;
            const x = Math.min(x0, e.clientX);
            const y = Math.min(y0, e.clientY);
            this.$box.style.left = `${x}px`;
            this.$box.style.top = `${y}px`;
            this.$box.style.width = `${Math.abs(dx)}px`;
            this.$box.style.height = `${Math.abs(dy)}px`;
            this.$box.classList.remove('hidden');
        };

        const onUp = (e: PointerEvent) => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
            this.$box.classList.add('hidden');

            if (!moved) {
                this.onEmptyClick();
                return;
            }

            const x1 = Math.min(x0, e.clientX);
            const y1 = Math.min(y0, e.clientY);
            const x2 = Math.max(x0, e.clientX);
            const y2 = Math.max(y0, e.clientY);

            const ids: number[] = [];
            this.getBubbleRects().forEach((rect, id) => {
                // 사각형 교차 (marquee box ∩ bubble bounding box)
                if (rect.right >= x1 && rect.left <= x2 && rect.bottom >= y1 && rect.top <= y2) {
                    ids.push(id);
                }
            });
            this.onMarqueeEnd(ids, additive);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }
}
