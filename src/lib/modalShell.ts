/**
 * 모달(전체 화면을 덮는 어두운 오버레이 + 가운데 카드)의 공통 뼈대를 만든다.
 *
 * ConfirmDialog / PresetPickerModal / ColorWheelPicker가 똑같이 쓰던
 * "fixed 오버레이 + 카드 + 바깥 클릭으로 닫기" 구조를 한 곳으로 모았다.
 *
 * 표시/숨김(hidden 토글), 키보드 처리, 내용 채우기는 모달마다 달라서
 * 각 컴포넌트가 직접 맡고, 여기서는 DOM 골격과 배경 클릭만 책임진다.
 */

// 오버레이는 z-index만 다르고 나머지는 동일하다. (hidden으로 시작해 열 때 제거)
const OVERLAY_BASE = 'fixed inset-0 flex items-center justify-center hidden bg-black/40 backdrop-blur-sm';
// 카드의 색/테두리/그림자/세로 정렬은 공통, 여백·너비·간격(cardSize)만 모달마다 다르다.
const CARD_BASE = 'bg-background border border-border rounded-xl shadow-xl flex flex-col';

export interface ModalShell {
    $overlay: HTMLDivElement;
    $card: HTMLDivElement;
}

export function createModalShell({
    zIndex,
    cardSize,
    onBackdropClick,
    $target,
}: {
    zIndex: string;        // 예: 'z-[70]'
    cardSize: string;      // 예: 'p-5 w-72 gap-4'
    onBackdropClick: () => void;
    $target?: HTMLElement; // 오버레이를 붙일 부모. 생략 시 document.body.
}): ModalShell {
    const $overlay = document.createElement('div');
    $overlay.className = `${OVERLAY_BASE} ${zIndex}`;
    ($target ?? document.body).appendChild($overlay);

    const $card = document.createElement('div');
    $card.className = `${CARD_BASE} ${cardSize}`;
    $overlay.appendChild($card);

    // 카드 바깥(어두운 배경)을 클릭했을 때만 닫는다. 카드 내부 클릭은 무시.
    $overlay.addEventListener('click', (e) => {
        if (e.target === $overlay) onBackdropClick();
    });

    return { $overlay, $card };
}
