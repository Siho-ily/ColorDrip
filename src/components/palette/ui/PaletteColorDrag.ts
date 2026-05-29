/**
 * 팔레트 색상 슬롯 드래그 관리.
 *
 * PaletteSidebar가 소유하고, PaletteSlotPanel이 pointerdown 감지 후 start()를 호출한다.
 * 선택된 슬롯을 드래그하면 선택 전체(colorIds)가 그룹으로 함께 이동한다.
 *
 * drop zone 세 가지:
 *   reorder  — 슬롯 패널 안: 순서 변경
 *   preset   — 탭 바 위    : 해당 프리셋으로 이동
 *   canvas   — 사이드바 밖 : 팔레트에서 제거 + 위험구역 표시
 */
export default class PaletteColorDrag {
    private $ghost: HTMLDivElement | null = null;
    private $dangerZone: HTMLDivElement;
    private $indicator: HTMLDivElement;

    private dragging: { presetId: string; colorIds: string[]; $slots: HTMLElement[] } | null = null;
    private highlightedTab: HTMLElement | null = null;
    private dropType: 'reorder' | 'preset' | 'canvas' | null = null;
    private insertIndex = 0;
    private lastDropX = 0;
    private lastDropY = 0;

    constructor(
        private readonly getSidebarEl: () => HTMLElement,
        private readonly getTabEls: () => HTMLElement[],
        private readonly getSlotEls: () => HTMLElement[],
        private readonly onReorder: (presetId: string, newColorIds: string[]) => void,
        private readonly onMoveToPreset: (fromPresetId: string, colorIds: string[], toPresetId: string) => void,
        private readonly onDropToCanvas: (presetId: string, colorIds: string[], x: number, y: number) => void,
    ) {
        this.$dangerZone = this.createDangerZone();
        this.$indicator = this.createIndicator();
    }

    start(presetId: string, colorIds: string[], cssColor: string, $slot: HTMLElement, e: PointerEvent) {
        // 그룹에 속한 모든 슬롯 DOM을 모아 dim 처리한다 (드래그한 슬롯 하나만이 아니라).
        const idSet = new Set(colorIds);
        const $slots = this.getSlotEls().filter(el => idSet.has(el.dataset.colorId ?? ''));
        this.dragging = { presetId, colorIds, $slots };

        this.$ghost = document.createElement('div');
        Object.assign(this.$ghost.style, {
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: '9999',
            width: '2rem',
            height: '2rem',
            borderRadius: '9999px',
            background: cssColor,
            transform: 'translate(-50%, -50%) scale(1.15)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,255,255,0.5)',
            left: `${e.clientX}px`,
            top: `${e.clientY}px`,
        });

        // 여러 개를 옮길 때는 개수 배지를 ghost에 붙인다.
        if (colorIds.length > 1) {
            const $badge = document.createElement('div');
            Object.assign($badge.style, {
                position: 'absolute',
                top: '-6px',
                right: '-6px',
                minWidth: '18px',
                height: '18px',
                padding: '0 4px',
                borderRadius: '9999px',
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 0 2px rgba(255,255,255,0.7)',
            });
            $badge.textContent = String(colorIds.length);
            this.$ghost.appendChild($badge);
        }

        document.body.appendChild(this.$ghost);

        $slots.forEach(s => {
            s.style.opacity = '0.3';
            s.style.pointerEvents = 'none';
        });

        document.addEventListener('pointermove', this.onMove);
        document.addEventListener('pointerup', this.onUp);
        document.addEventListener('keydown', this.onKeyDown);

        this.update(e.clientX, e.clientY);
    }

    private readonly onMove = (e: PointerEvent) => {
        if (!this.$ghost) return;
        this.lastDropX = e.clientX;
        this.lastDropY = e.clientY;
        this.$ghost.style.left = `${e.clientX}px`;
        this.$ghost.style.top = `${e.clientY}px`;
        this.update(e.clientX, e.clientY);
    };

    private readonly onUp = () => {
        if (!this.dragging) return;
        const { presetId, colorIds } = this.dragging;

        if (this.dropType === 'reorder') {
            const idSet = new Set(colorIds);
            const allIds = this.getSlotEls().map(el => el.dataset.colorId!);
            const remaining = allIds.filter(id => !idSet.has(id));
            // 그룹은 현재 패널 순서를 유지한 채 insertIndex 위치에 통째로 삽입한다.
            const group = allIds.filter(id => idSet.has(id));
            remaining.splice(this.insertIndex, 0, ...group);
            this.onReorder(presetId, remaining);
        } else if (this.dropType === 'preset' && this.highlightedTab) {
            this.onMoveToPreset(presetId, colorIds, this.highlightedTab.dataset.presetId!);
        } else if (this.dropType === 'canvas') {
            this.onDropToCanvas(presetId, colorIds, this.lastDropX, this.lastDropY);
        }

        this.cleanup();
    };

    private readonly onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.cleanup();
    };

    private update(x: number, y: number) {
        if (!this.dragging) return;
        const { presetId, colorIds } = this.dragging;
        const dragIds = new Set(colorIds);
        const sb = this.getSidebarEl().getBoundingClientRect();

        if (x < sb.left || x > sb.right || y < sb.top || y > sb.bottom) {
            this.dropType = 'canvas';
            this.showDangerZone(sb.left);
            this.clearTabHighlight();
            this.hideIndicator();
            return;
        }

        this.hideDangerZone();

        const hoveredTab = this.getTabEls().find(t => {
            if (t.dataset.presetId === presetId) return false;
            const r = t.getBoundingClientRect();
            return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
        }) ?? null;

        if (hoveredTab) {
            this.dropType = 'preset';
            this.setTabHighlight(hoveredTab);
            this.hideIndicator();
            return;
        }

        this.clearTabHighlight();
        this.dropType = 'reorder';

        const slots = this.getSlotEls();
        this.insertIndex = this.calcInsertIndex(slots, x, y, dragIds);
        this.updateIndicator(slots, this.insertIndex, dragIds);
    }

    private calcInsertIndex(slots: HTMLElement[], x: number, y: number, dragIds: Set<string>): number {
        const visible = slots.filter(s => !dragIds.has(s.dataset.colorId ?? ''));
        if (!visible.length) return 0;

        let best = visible.length;
        let bestDist = Infinity;
        visible.forEach((el, i) => {
            const r = el.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const d = Math.hypot(x - cx, y - cy);
            if (d < bestDist) { bestDist = d; best = x <= cx ? i : i + 1; }
        });
        return best;
    }

    private updateIndicator(slots: HTMLElement[], index: number, dragIds: Set<string>) {
        const visible = slots.filter(s => !dragIds.has(s.dataset.colorId ?? ''));
        if (!visible.length) { this.hideIndicator(); return; }

        const n = visible.length;
        // index 0: left of first, index n: right of last, otherwise between slots
        let x: number, top: number, height: number;
        if (index === 0) {
            const r = visible[0].getBoundingClientRect();
            x = r.left - 3; top = r.top; height = r.height;
        } else if (index >= n) {
            const r = visible[n - 1].getBoundingClientRect();
            x = r.right + 1; top = r.top; height = r.height;
        } else {
            const rA = visible[index - 1].getBoundingClientRect();
            const rB = visible[index].getBoundingClientRect();
            // same row: place midpoint; different row: right edge of prev
            if (Math.abs(rA.top - rB.top) < 8) {
                x = (rA.right + rB.left) / 2; top = rA.top; height = rA.height;
            } else {
                x = rA.right + 1; top = rA.top; height = rA.height;
            }
        }

        Object.assign(this.$indicator.style, {
            left: `${x}px`, top: `${top}px`, height: `${height}px`,
        });
        this.$indicator.classList.remove('hidden');
    }

    private hideIndicator() { this.$indicator.classList.add('hidden'); }

    private showDangerZone(sidebarLeft: number) {
        this.$dangerZone.style.right = `${window.innerWidth - sidebarLeft}px`;
        this.$dangerZone.style.display = 'flex';
    }

    private hideDangerZone() { this.$dangerZone.style.display = 'none'; }

    private setTabHighlight(tab: HTMLElement) {
        if (this.highlightedTab === tab) return;
        this.clearTabHighlight();
        this.highlightedTab = tab;
        tab.style.outline = '2px solid hsl(var(--primary))';
        tab.style.outlineOffset = '2px';
    }

    private clearTabHighlight() {
        if (!this.highlightedTab) return;
        this.highlightedTab.style.outline = '';
        this.highlightedTab.style.outlineOffset = '';
        this.highlightedTab = null;
    }

    private cleanup() {
        this.$ghost?.remove();
        this.$ghost = null;

        if (this.dragging) {
            this.dragging.$slots.forEach(s => {
                s.style.opacity = '';
                s.style.pointerEvents = '';
            });
            this.dragging = null;
        }

        this.dropType = null;
        this.clearTabHighlight();
        this.hideIndicator();
        this.hideDangerZone();

        document.removeEventListener('pointermove', this.onMove);
        document.removeEventListener('pointerup', this.onUp);
        document.removeEventListener('keydown', this.onKeyDown);
    }

    private createDangerZone(): HTMLDivElement {
        const $el = document.createElement('div');
        Object.assign($el.style, {
            position: 'fixed',
            top: '0', bottom: '0', left: '0',
            pointerEvents: 'none',
            zIndex: '5500',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(to right, rgba(99,102,241,0.10), rgba(99,102,241,0.02))',
            borderRight: '2px dashed rgba(99,102,241,0.35)',
        });
        $el.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px;color:rgba(99,102,241,0.8);user-select:none">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="9"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <span style="font-size:0.75rem;font-weight:600;letter-spacing:0.01em">캔버스에 추가</span>
            </div>
        `;
        document.body.appendChild($el);
        return $el;
    }

    private createIndicator(): HTMLDivElement {
        const $el = document.createElement('div');
        Object.assign($el.style, {
            position: 'fixed',
            width: '2px',
            borderRadius: '9999px',
            background: 'hsl(var(--primary))',
            pointerEvents: 'none',
            zIndex: '6500',
        });
        $el.classList.add('hidden');
        document.body.appendChild($el);
        return $el;
    }
}
