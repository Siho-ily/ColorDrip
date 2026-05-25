/**
 * 드래그로 스크롤하는 동작을 요소에 붙인다.
 *
 * 마우스/터치로 요소 안을 드래그하면 스크롤바 없이 스크롤된다.
 * input, button 위에서는 드래그 스크롤을 시작하지 않는다 (클릭 동작 보존).
 */
export function attachDragScroll($el: HTMLElement) {
    let startY = 0;       // 드래그 시작 시점의 포인터 Y 좌표
    let startScroll = 0;  // 드래그 시작 시점의 scrollTop 값
    let active = false;   // pointerdown이 발생해 드래그를 감시 중인 상태
    let dragging = false; // 임계값(4px)을 넘어 실제 스크롤 중인 상태

    $el.addEventListener('pointerdown', (e) => {
        if ((e.target as HTMLElement).closest('input,button')) return;
        startY = e.clientY;
        startScroll = $el.scrollTop;
        active = true;
        dragging = false;
    });

    $el.addEventListener('pointermove', (e) => {
        if (!active) return;
        const dy = e.clientY - startY;

        if (!dragging && Math.abs(dy) > 4) {
            dragging = true;
            // setPointerCapture: 포인터가 요소 밖으로 나가도 이 요소가 이벤트를 계속 받는다.
            // 빠르게 드래그할 때 커서가 요소를 벗어나도 스크롤이 끊기지 않는 이유.
            $el.setPointerCapture(e.pointerId);
        }
        if (dragging) $el.scrollTop = startScroll - dy;
    });

    const end = (e: PointerEvent) => {
        if (!active) return;
        active = false;
        if (dragging && $el.hasPointerCapture(e.pointerId)) $el.releasePointerCapture(e.pointerId);
    };
    $el.addEventListener('pointerup', end);
    $el.addEventListener('pointercancel', end);

    // 드래그 후 pointerup → click 순서로 이벤트가 발생한다.
    // 스크롤이었다면 click을 막아 의도치 않은 버튼 클릭을 방지한다.
    // capture: true로 등록해 자식 요소의 click보다 먼저 가로챈다.
    $el.addEventListener('click', (e) => {
        if (dragging) {
            e.stopPropagation();
            e.preventDefault();
            dragging = false;
        }
    }, true);
}
