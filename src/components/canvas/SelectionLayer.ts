/**
 * 빈 공간 드래그로 버블을 다중 선택하는 marquee 레이어.
 *
 * - RainCanvas의 빈 클릭(hit 없는 pointerdown)이 startMarquee로 들어온다
 * - 박스/포인터 처리는 공통 Marquee가 담당하고, 여기서는 버블 교차 판정만 구현한다
 * - 종료 시점에 getBubbleRects로 현재 버블 위치를 1회 쿼리해 교차 판정 → onMarqueeEnd
 */
import Marquee from '@/lib/Marquee';

export default class SelectionLayer {
    private marquee: Marquee<number>;

    constructor({
        getBubbleRects,
        onMarqueeEnd,
        onEmptyClick,
    }: {
        getBubbleRects: () => Map<number, DOMRect>;
        onMarqueeEnd: (ids: number[], additive: boolean) => void;
        onEmptyClick: () => void;
    }) {
        this.marquee = new Marquee<number>({
            onMarqueeEnd,
            onEmptyClick,
            collectHits: (box) => {
                const ids: number[] = [];
                getBubbleRects().forEach((rect, id) => {
                    // 사각형 교차 (marquee box ∩ bubble bounding box)
                    if (rect.right >= box.x1 && rect.left <= box.x2 && rect.bottom >= box.y1 && rect.top <= box.y2) {
                        ids.push(id);
                    }
                });
                return ids;
            },
        });
    }

    startMarquee(downEvent: PointerEvent) {
        this.marquee.start(downEvent);
    }
}
