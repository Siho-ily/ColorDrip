/**
 * 슬롯 패널 빈 공간 드래그로 색상 슬롯을 다중 선택하는 marquee 레이어.
 *
 * 캔버스 SelectionLayer와 박스/포인터 처리를 공통 Marquee로 공유한다.
 * 차이점은 대상이 버블이 아니라 [data-color-id] 슬롯이라 id가 string이고,
 * 교차 판정 시점에 컨테이너 내부 슬롯의 rect를 직접 스캔한다는 점뿐이다.
 */
import Marquee from '@/lib/Marquee';

export default class PaletteSelectionLayer {
    private marquee: Marquee<string>;

    constructor({
        getSlotEls,
        onMarqueeEnd,
        onEmptyClick,
    }: {
        getSlotEls: () => HTMLElement[];
        onMarqueeEnd: (ids: string[], additive: boolean) => void;
        onEmptyClick: () => void;
    }) {
        this.marquee = new Marquee<string>({
            onMarqueeEnd,
            onEmptyClick,
            collectHits: (box) => {
                const ids: string[] = [];
                getSlotEls().forEach(el => {
                    const id = el.dataset.colorId;
                    if (!id) return;
                    const rect = el.getBoundingClientRect();
                    // 사각형 교차 (marquee box ∩ slot bounding box)
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
