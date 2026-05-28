/**
 * 마우스 hover 시 색상 코드를 표시하는 글래스 스타일 툴팁.
 *
 * 단일 인스턴스(싱글톤)로 동작 — DOM에는 div 하나만 존재하고,
 * showTooltip / hideTooltip 호출로 텍스트와 위치를 갱신한다.
 *
 * 사용 예시:
 *   $el.addEventListener('pointerenter', e => showTooltip(formatColor(c, n), e.clientX, e.clientY));
 *   $el.addEventListener('pointermove',  e => moveTooltip(e.clientX, e.clientY));
 *   $el.addEventListener('pointerleave', () => hideTooltip());
 */

let $tooltip: HTMLDivElement | null = null;

function ensureTooltip(): HTMLDivElement {
    if ($tooltip) return $tooltip;
    const el = document.createElement('div');
    Object.assign(el.style, {
        position: 'fixed',
        zIndex: '30',                 // ContextMenu(z-40)보다 아래, MenuBar/캔버스 위
        pointerEvents: 'none',
        padding: '4px 8px',
        fontSize: '11px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        color: 'var(--glass-text)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '8px',
        boxShadow: 'var(--glass-shadow)',
        whiteSpace: 'nowrap',
        opacity: '0',
        transition: 'opacity 0.12s',
    } as Partial<CSSStyleDeclaration>);
    document.body.appendChild(el);
    $tooltip = el;
    return el;
}

const OFFSET_X = 12;
const OFFSET_Y = 16;

function placeAt(x: number, y: number) {
    const el = ensureTooltip();
    // 화면 우/하단 경계에 닿으면 반대쪽으로 뒤집어 노출이 잘리지 않도록 한다.
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let nx = x + OFFSET_X;
    let ny = y + OFFSET_Y;
    if (nx + rect.width > vw - 4)  nx = x - rect.width - OFFSET_X;
    if (ny + rect.height > vh - 4) ny = y - rect.height - OFFSET_Y;
    el.style.left = `${Math.max(4, nx)}px`;
    el.style.top  = `${Math.max(4, ny)}px`;
}

export function showTooltip(text: string, x: number, y: number) {
    const el = ensureTooltip();
    el.textContent = text;
    placeAt(x, y);
    el.style.opacity = '1';
}

export function moveTooltip(x: number, y: number) {
    if (!$tooltip || $tooltip.style.opacity === '0') return;
    placeAt(x, y);
}

export function hideTooltip() {
    if (!$tooltip) return;
    $tooltip.style.opacity = '0';
}
