/**
 * 팔레트 사이드바 오른쪽 패널.
 *
 * 선택된 프리셋의 색상 슬롯을 원형 버튼으로 나열한다.
 * 프리셋이 없으면 안내 문구를 표시한다.
 *
 * 슬롯 상호작용(캔버스 선택 UX 미러링):
 *   - 평클릭/쉬프트클릭 → 선택/토글 (onColorSlotSelect)
 *   - 더블클릭         → 단일 캔버스 추가 (onColorSlotActivate)
 *   - 빈 영역 드래그   → marquee 다중 선택 (PaletteSelectionLayer)
 *   - 슬롯 드래그      → 순서변경/프리셋이동/캔버스드롭 (그룹 단위)
 */
import type { Preset, PresetColor } from '@/types/palette';
import type { HslColor } from '@/types/bubble';
import type { ColorNotation } from '@/types/settings';
import { hslToCss, formatColor } from '@/lib/color';
import { showTooltip, hideTooltip, moveTooltip } from '@/components/global/ui/ColorTooltip';
import PaletteSelectionLayer from './PaletteSelectionLayer';

export default class PaletteSlotPanel {
    private $el: HTMLDivElement;
    private selectionLayer: PaletteSelectionLayer;

    private readonly onColorSlotSelect: (colorId: string, additive: boolean) => void;
    private readonly onColorSlotActivate: (presetColor: PresetColor) => void;
    private readonly onAddColor: () => void;
    private readonly onColorSlotContextMenu: (presetId: string, colorId: string, color: HslColor, rect: DOMRect) => void;
    private readonly onSlotDragStart: (presetId: string, colorIds: string[], cssColor: string, $slot: HTMLElement, e: PointerEvent) => void;
    private readonly getColorNotation: () => ColorNotation;
    private readonly getSelectedColorIds: () => string[];

    constructor({
        $target,
        onColorSlotSelect,
        onColorSlotActivate,
        onAddColor,
        onColorSlotContextMenu,
        onSlotDragStart,
        onMarqueeSelect,
        onEmptyClick,
        getColorNotation,
        getSelectedColorIds,
    }: {
        $target: HTMLElement;
        onColorSlotSelect: (colorId: string, additive: boolean) => void;
        onColorSlotActivate: (presetColor: PresetColor) => void;
        onAddColor: () => void;
        onColorSlotContextMenu: (presetId: string, colorId: string, color: HslColor, rect: DOMRect) => void;
        onSlotDragStart: (presetId: string, colorIds: string[], cssColor: string, $slot: HTMLElement, e: PointerEvent) => void;
        onMarqueeSelect: (colorIds: string[], additive: boolean) => void;
        onEmptyClick: () => void;
        getColorNotation: () => ColorNotation;
        getSelectedColorIds: () => string[];
    }) {
        this.onColorSlotSelect = onColorSlotSelect;
        this.onColorSlotActivate = onColorSlotActivate;
        this.onAddColor = onAddColor;
        this.onColorSlotContextMenu = onColorSlotContextMenu;
        this.onSlotDragStart = onSlotDragStart;
        this.getColorNotation = getColorNotation;
        this.getSelectedColorIds = getSelectedColorIds;

        this.$el = document.createElement('div');
        this.$el.className = [
            'flex flex-col p-3 gap-3 overflow-y-auto overflow-x-hidden scrollbar-hidden',
            'bg-background/95 backdrop-blur border-l border-border w-52',
        ].join(' ');
        $target.appendChild(this.$el);

        this.selectionLayer = new PaletteSelectionLayer({
            getSlotEls: () => [...this.$el.querySelectorAll<HTMLElement>('[data-color-id]')],
            onMarqueeEnd: onMarqueeSelect,
            onEmptyClick,
        });

        // 빈 영역(슬롯·+버튼이 아닌 곳) 드래그 → marquee 선택.
        // 슬롯 위 pointerdown은 슬롯 자체의 드래그 로직이 처리하므로 button 안에서는 시작하지 않는다.
        this.$el.addEventListener('pointerdown', (e) => {
            if (e.button !== 0) return;
            if ((e.target as HTMLElement).closest('button')) return;
            this.selectionLayer.startMarquee(e);
        });
    }

    render(preset: Preset | null) {
        this.$el.innerHTML = '';

        if (!preset) {
            const $empty = document.createElement('p');
            $empty.className = 'text-xs text-muted-foreground text-center mt-4';
            $empty.textContent = '프리셋을 선택하세요';
            this.$el.appendChild($empty);
            return;
        }

        const $title = document.createElement('p');
        $title.className = 'block w-full min-w-0 text-xs font-medium text-foreground truncate';
        $title.textContent = preset.name;
        this.$el.appendChild($title);

        const $grid = document.createElement('div');
        $grid.className = 'flex flex-wrap gap-2';

        const selectedSet = new Set(this.getSelectedColorIds());

        preset.colors.forEach(pc => {
            const $slot = document.createElement('button');
            $slot.className = [
                'w-8 h-8 rounded-full border-2 border-transparent',
                'hover:border-primary hover:scale-110 transition-all cursor-grab',
            ].join(' ');
            $slot.dataset.colorId = pc.id;
            $slot.style.background = hslToCss(pc.color);
            if (selectedSet.has(pc.id)) $slot.classList.add('swatch-selected');

            // 호버 시 표기 방식에 맞춰 커스텀 툴팁 표시 (label이 있으면 우선)
            $slot.addEventListener('pointerenter', (e) => {
                const text = pc.label ?? formatColor(pc.color, this.getColorNotation());
                showTooltip(text, e.clientX, e.clientY);
            });
            $slot.addEventListener('pointermove', (e) => moveTooltip(e.clientX, e.clientY));
            $slot.addEventListener('pointerleave', () => hideTooltip());

            // 5px 이상 움직여야 드래그 시작 — 클릭과 드래그를 구분
            $slot.addEventListener('pointerdown', (e) => {
                if (e.button !== 0) return;
                const startX = e.clientX, startY = e.clientY;
                const onMove = (me: PointerEvent) => {
                    if (Math.hypot(me.clientX - startX, me.clientY - startY) < 5) return;
                    cleanup();
                    // 드래그가 실제로 시작된 경우에만 click 방지 리스너를 등록한다.
                    // (일반 클릭에선 등록하지 않아 불필요한 리스너 등록/해제 churn을 피한다)
                    $slot.addEventListener('click', (ce) => {
                        ce.stopImmediatePropagation();
                        ce.preventDefault();
                    }, { once: true, capture: true });
                    // 드래그한 슬롯이 선택에 포함되고 2개 이상 선택이면 선택 전체를 그룹으로 옮긴다.
                    const selected = this.getSelectedColorIds();
                    const group = selected.length > 1 && selected.includes(pc.id) ? selected : [pc.id];
                    this.onSlotDragStart(preset.id, group, hslToCss(pc.color), $slot, me);
                };
                const onUp = () => cleanup();
                const cleanup = () => {
                    document.removeEventListener('pointermove', onMove);
                    document.removeEventListener('pointerup', onUp);
                };

                document.addEventListener('pointermove', onMove);
                document.addEventListener('pointerup', onUp);
            });

            $slot.addEventListener('click', (e) => this.onColorSlotSelect(pc.id, e.shiftKey));
            $slot.addEventListener('dblclick', () => this.onColorSlotActivate(pc));
            $slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.onColorSlotContextMenu(preset.id, pc.id, pc.color, $slot.getBoundingClientRect());
            });
            $grid.appendChild($slot);
        });

        this.$el.appendChild($grid);

        const $addColor = document.createElement('button');
        $addColor.className = [
            'w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/40',
            'flex items-center justify-center text-muted-foreground text-base',
            'hover:border-primary hover:text-primary transition-colors',
        ].join(' ');
        $addColor.textContent = '+';
        $addColor.title = '새 색상 추가';
        $addColor.addEventListener('click', () => this.onAddColor());
        // 색상 슬롯 그리드 안에 + 버튼을 넣어 자연스럽게 줄바꿈되도록 한다.
        $grid.appendChild($addColor);
    }

    // 선택 상태만 바뀌었을 때 전체 재렌더 없이 ring class만 토글한다.
    syncSelection(ids: Set<string>) {
        this.$el.querySelectorAll<HTMLElement>('[data-color-id]').forEach(el => {
            el.classList.toggle('swatch-selected', ids.has(el.dataset.colorId ?? ''));
        });
    }
}
