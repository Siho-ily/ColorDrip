/**
 * 팔레트 사이드바 오른쪽 패널.
 *
 * 선택된 프리셋의 색상 슬롯을 원형 버튼으로 나열한다.
 * 프리셋이 없으면 안내 문구를 표시한다.
 */
import type { Preset, PresetColor } from '@/types/palette';
import type { HslColor } from '@/types/bubble';
import { hslToCss } from '@/lib/color';
import { attachDragScroll } from '@/lib/dragScroll';

export default class PaletteSlotPanel {
    private $el: HTMLDivElement;

    private readonly onColorSlotClick: (presetColor: PresetColor) => void;
    private readonly onAddColor: () => void;
    private readonly onColorSlotContextMenu: (presetId: string, colorId: string, color: HslColor, rect: DOMRect) => void;

    constructor({
        $target,
        onColorSlotClick,
        onAddColor,
        onColorSlotContextMenu,
    }: {
        $target: HTMLElement;
        onColorSlotClick: (presetColor: PresetColor) => void;
        onAddColor: () => void;
        onColorSlotContextMenu: (presetId: string, colorId: string, color: HslColor, rect: DOMRect) => void;
    }) {
        this.onColorSlotClick = onColorSlotClick;
        this.onAddColor = onAddColor;
        this.onColorSlotContextMenu = onColorSlotContextMenu;

        this.$el = document.createElement('div');
        this.$el.className = [
            'flex flex-col p-3 gap-3 overflow-y-auto overflow-x-hidden scrollbar-hidden',
            'bg-background/95 backdrop-blur border-l border-border w-52',
        ].join(' ');
        $target.appendChild(this.$el);

        attachDragScroll(this.$el);
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

        preset.colors.forEach(pc => {
            const $slot = document.createElement('button');
            $slot.className = [
                'w-8 h-8 rounded-full border-2 border-transparent',
                'hover:border-primary hover:scale-110 transition-all cursor-pointer',
            ].join(' ');
            $slot.style.background = hslToCss(pc.color);
            $slot.title = pc.label ?? hslToCss(pc.color);
            $slot.addEventListener('click', () => this.onColorSlotClick(pc));
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
}
