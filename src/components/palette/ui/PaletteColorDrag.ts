/**
 * 팔레트 색상 슬롯 드래그 관리.
 *
 * PaletteSidebar가 소유하고, PaletteSlotPanel이 pointerdown 감지 후 start()를 호출한다.
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

    private dragging: { presetId: string; colorId: string; $slot: HTMLElement } | null = null;
    private highlightedTab: HTMLElement | null = null;
    private dropType: 'reorder' | 'preset' | 'canvas' | null = null;
    private insertIndex = 0;

    constructor(
        private readonly getSidebarEl: () => HTMLElement,
        private readonly getTabEls: () => HTMLElement[],
        private readonly getSlotEls: () => HTMLElement[],
        private readonly onReorder: (presetId: string, newColorIds: string[]) => void,
        private readonly onMoveToPreset: (fromPresetId: string, colorId: string, toPresetId: string) => void,
        private readonly onDropToCanvas: (presetId: string, colorId: string) => void,
    ) {
        this.$dangerZone = this.createDangerZone();
        this.$indicator = this.createIndicator();
    }

    start(presetId: string, colorId: string, cssColor: string, $slot: HTMLElement, e: PointerEvent) {
        this.dragging = { presetId, colorId, $slot };

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
        document.body.appendChild(this.$ghost);

        $slot.style.opacity = '0.3';
        $slot.style.pointerEvents = 'none';

        document.addEventListener('pointermove', this.onMove);
        document.addEventListener('pointerup', this.onUp);
        document.addEventListener('keydown', this.onKeyDown);

        this.update(e.clientX, e.clientY);
    }

    private readonly onMove = (e: PointerEvent) => {
        if (!this.$ghost) return;
        this.$ghost.style.left = `${e.clientX}px`;
        this.$ghost.style.top = `${e.clientY}px`;
        this.update(e.clientX, e.clientY);
    };

    private readonly onUp = () => {
        if (!this.dragging) return;
        const { presetId, colorId } = this.dragging;

        if (this.dropType === 'reorder') {
            const allIds = this.getSlotEls().map(el => el.dataset.colorId!);
            const newIds = allIds.filter(id => id !== colorId);
            newIds.splice(this.insertIndex, 0, colorId);
            this.onReorder(presetId, newIds);
        } else if (this.dropType === 'preset' && this.highlightedTab) {
            this.onMoveToPreset(presetId, colorId, this.highlightedTab.dataset.presetId!);
        } else if (this.dropType === 'canvas') {
            this.onDropToCanvas(presetId, colorId);
        }

        this.cleanup();
    };

    private readonly onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.cleanup();
    };

    private update(x: number, y: number) {
        if (!this.dragging) return;
        const { presetId, colorId } = this.dragging;
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
        this.insertIndex = this.calcInsertIndex(slots, x, y, colorId);
        this.updateIndicator(slots, this.insertIndex, colorId);
    }

    private calcInsertIndex(slots: HTMLElement[], x: number, y: number, dragId: string): number {
        const visible = slots.filter(s => s.dataset.colorId !== dragId);
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

    private updateIndicator(slots: HTMLElement[], index: number, dragId: string) {
        const visible = slots.filter(s => s.dataset.colorId !== dragId);
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
            this.dragging.$slot.style.opacity = '';
            this.dragging.$slot.style.pointerEvents = '';
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
            background: 'linear-gradient(to right, rgba(239,68,68,0.12), rgba(239,68,68,0.02))',
            borderRight: '2px dashed rgba(239,68,68,0.4)',
        });
        $el.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;gap:10px;color:rgba(239,68,68,0.75);user-select:none">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6l-1 14H6L5 6"></path>
                    <path d="M10 11v6M14 11v6"></path>
                    <path d="M9 6V4h6v2"></path>
                </svg>
                <span style="font-size:0.75rem;font-weight:600;letter-spacing:0.01em">팔레트에서 제거</span>
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
