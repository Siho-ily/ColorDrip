/**
 * 빈 공간 드래그로 대상을 다중 선택하는 marquee(고무줄 선택) 박스.
 *
 * 캔버스 버블과 팔레트 색상 슬롯이 똑같은 박스/임계값/포인터 처리를 쓰고
 * "무엇을 선택 대상으로 볼지"만 달라서, 공통 로직을 이 클래스로 모았다.
 *
 * 대상 종류(버블/슬롯)에 따라 id 타입이 다르므로 제네릭 <ID>로 둔다.
 * 실제 교차 판정은 주입받은 collectHits 콜백에 위임한다.
 *
 * - start(downEvent)로 시작. window pointermove/up 리스너로 박스 갱신·종료.
 * - 이동 거리 < THRESHOLD이면 드래그가 아닌 빈 클릭으로 보고 onEmptyClick 호출.
 * - 종료 시 박스 영역을 collectHits에 넘겨 선택된 id 목록을 onMarqueeEnd로 전달.
 */

const THRESHOLD = 4;  // px. 이 거리 미만이면 marquee가 아닌 빈 클릭으로 처리

/** marquee 박스의 viewport 좌표 경계 (left=x1, top=y1, right=x2, bottom=y2). */
export interface MarqueeBox {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export default class Marquee<ID> {
    private $box: HTMLDivElement;
    private readonly collectHits: (box: MarqueeBox) => ID[];
    private readonly onMarqueeEnd: (ids: ID[], additive: boolean) => void;
    private readonly onEmptyClick: () => void;

    constructor({
        collectHits,
        onMarqueeEnd,
        onEmptyClick,
    }: {
        collectHits: (box: MarqueeBox) => ID[];
        onMarqueeEnd: (ids: ID[], additive: boolean) => void;
        onEmptyClick: () => void;
    }) {
        this.collectHits = collectHits;
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

    start(downEvent: PointerEvent) {
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

            const box: MarqueeBox = {
                x1: Math.min(x0, e.clientX),
                y1: Math.min(y0, e.clientY),
                x2: Math.max(x0, e.clientX),
                y2: Math.max(y0, e.clientY),
            };
            this.onMarqueeEnd(this.collectHits(box), additive);
        };

        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    }
}
