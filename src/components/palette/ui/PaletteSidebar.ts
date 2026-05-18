import type { State } from "@/types/state";
import type { Preset, PresetColor } from "@/types/palette";
import { hslToCss } from "@/lib/color";

export default class PaletteSidebar {
    private $el: HTMLDivElement;
    private $tabBar: HTMLDivElement;
    private $slotPanel: HTMLDivElement;
    private editingPresetId: string | null = null;

    private readonly onAddPreset: () => void;
    private readonly onSelectPreset: (presetId: string) => void;
    private readonly onRenamePreset: (presetId: string, name: string) => void;
    private readonly onDeletePreset: (presetId: string) => void;
    private readonly onColorSlotClick: (presetColor: PresetColor) => void;
    private readonly onAddColor: () => void;

    constructor({
        $target,
        onAddPreset,
        onSelectPreset,
        onRenamePreset,
        onDeletePreset,
        onColorSlotClick,
        onAddColor,
    }: {
        $target: HTMLElement;
        onAddPreset: () => void;
        onSelectPreset: (presetId: string) => void;
        onRenamePreset: (presetId: string, name: string) => void;
        onDeletePreset: (presetId: string) => void;
        onColorSlotClick: (presetColor: PresetColor) => void;
        onAddColor: () => void;
    }) {
        this.onAddPreset = onAddPreset;
        this.onSelectPreset = onSelectPreset;
        this.onRenamePreset = onRenamePreset;
        this.onDeletePreset = onDeletePreset;
        this.onColorSlotClick = onColorSlotClick;
        this.onAddColor = onAddColor;

        this.$el = document.createElement('div');
        this.$el.className = 'fixed right-0 top-0 h-full z-30 flex hidden';
        $target.appendChild(this.$el);

        this.$tabBar = document.createElement('div');
        this.$tabBar.className = [
            'flex flex-col gap-1 p-2 overflow-y-auto overflow-x-hidden scrollbar-hidden',
            'bg-background/90 backdrop-blur border-l border-border w-16',
        ].join(' ');
        this.$el.appendChild(this.$tabBar);

        this.$slotPanel = document.createElement('div');
        this.$slotPanel.className = [
            'flex flex-col p-3 gap-3 overflow-y-auto overflow-x-hidden scrollbar-hidden',
            'bg-background/95 backdrop-blur border-l border-border w-52',
        ].join(' ');
        this.$el.appendChild(this.$slotPanel);

        this.attachDragScroll(this.$tabBar);
        this.attachDragScroll(this.$slotPanel);
    }

    private attachDragScroll($el: HTMLElement) {
        let startY = 0;
        let startScroll = 0;
        let active = false;
        let dragging = false;

        $el.addEventListener('pointerdown', (e) => {
            const target = e.target as HTMLElement;
            if (target.closest('input,button')) return;
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
                $el.setPointerCapture(e.pointerId);
            }
            if (dragging) {
                $el.scrollTop = startScroll - dy;
            }
        });

        const end = (e: PointerEvent) => {
            if (!active) return;
            active = false;
            if (dragging && $el.hasPointerCapture(e.pointerId)) {
                $el.releasePointerCapture(e.pointerId);
            }
        };
        $el.addEventListener('pointerup', end);
        $el.addEventListener('pointercancel', end);

        $el.addEventListener('click', (e) => {
            if (dragging) {
                e.stopPropagation();
                e.preventDefault();
                dragging = false;
            }
        }, true);
    }

    setState(state: State) {
        const { open, presets, activePresetId } = state.palette;

        if (open) {
            this.$el.classList.remove('hidden');
        } else {
            this.$el.classList.add('hidden');
            return;
        }

        this.renderTabBar(presets, activePresetId);

        const activePreset = presets.find(p => p.id === activePresetId) ?? null;
        this.renderSlotPanel(activePreset);
    }

    private renderTabBar(presets: Preset[], activePresetId: string | null) {
        this.$tabBar.innerHTML = '';

        for (const preset of presets) {
            const $tab = this.buildTab(preset, preset.id === activePresetId);
            this.$tabBar.appendChild($tab);
        }

        const $addBtn = document.createElement('button');
        $addBtn.className = [
            'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
            'text-xl text-muted-foreground hover:text-foreground',
            'hover:bg-accent transition-colors mt-1',
        ].join(' ');
        $addBtn.textContent = '+';
        $addBtn.title = '새 프리셋';
        $addBtn.addEventListener('click', () => this.onAddPreset());
        this.$tabBar.appendChild($addBtn);
    }

    private buildTab(preset: Preset, isActive: boolean): HTMLDivElement {
        const $tab = document.createElement('div');
        $tab.className = [
            'relative w-12 h-12 rounded-lg cursor-pointer flex flex-col items-center justify-center gap-0.5 px-1 py-1',
            'border transition-all select-none min-w-0 overflow-hidden flex-shrink-0',
            isActive
                ? 'border-primary bg-accent'
                : 'border-transparent hover:border-border hover:bg-accent/50',
        ].join(' ');
        $tab.dataset.presetId = preset.id;

        // 색상 미리보기 (최대 3개, 원형)
        const $preview = document.createElement('div');
        $preview.className = 'flex gap-0.5 flex-wrap justify-center';
        preset.colors.slice(0, 3).forEach(pc => {
            const $dot = document.createElement('div');
            $dot.className = 'w-2.5 h-2.5 rounded-full flex-shrink-0';
            $dot.style.background = hslToCss(pc.color);
            $preview.appendChild($dot);
        });
        if (preset.colors.length === 0) {
            const $dot = document.createElement('div');
            $dot.className = 'w-2.5 h-2.5 rounded-full bg-muted-foreground/30';
            $preview.appendChild($dot);
        }
        $tab.appendChild($preview);

        // 프리셋 이름 (편집 모드이면 input으로)
        if (this.editingPresetId === preset.id) {
            const $input = document.createElement('input');
            $input.className = 'w-full text-center text-xs bg-transparent outline-none border-b border-primary';
            $input.value = preset.name;

            const commit = () => {
                const name = $input.value.trim() || preset.name;
                this.editingPresetId = null;
                this.onRenamePreset(preset.id, name);
            };

            $input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') { e.preventDefault(); $input.blur(); }
                if (e.key === 'Escape') { this.editingPresetId = null; $input.blur(); }
            });
            $input.addEventListener('blur', commit);
            $tab.appendChild($input);

            // 마운트 후 포커스
            setTimeout(() => { $input.focus(); $input.select(); }, 0);
        } else {
            const $name = document.createElement('span');
            $name.className = 'block w-full min-w-0 text-xs text-center leading-tight truncate text-foreground';
            $name.textContent = preset.name;
            $tab.appendChild($name);
        }

        // 클릭 → 프리셋 선택
        $tab.addEventListener('click', () => {
            if (this.editingPresetId === preset.id) return;
            this.onSelectPreset(preset.id);
        });

        // 더블클릭 → 이름 편집
        $tab.addEventListener('dblclick', () => {
            this.editingPresetId = preset.id;
            this.onSelectPreset(preset.id);
        });

        // 우클릭 → 삭제
        $tab.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (confirm(`"${preset.name}" 프리셋을 삭제할까요?`)) {
                this.onDeletePreset(preset.id);
            }
        });

        return $tab;
    }

    private renderSlotPanel(preset: Preset | null) {
        this.$slotPanel.innerHTML = '';

        if (!preset) {
            const $empty = document.createElement('p');
            $empty.className = 'text-xs text-muted-foreground text-center mt-4';
            $empty.textContent = '프리셋을 선택하세요';
            this.$slotPanel.appendChild($empty);
            return;
        }

        const $title = document.createElement('p');
        $title.className = 'block w-full min-w-0 text-xs font-medium text-foreground truncate';
        $title.textContent = preset.name;
        this.$slotPanel.appendChild($title);

        const $grid = document.createElement('div');
        $grid.className = 'flex flex-wrap gap-2';

        preset.colors.forEach(pc => {
            const $slot = document.createElement('button');
            $slot.className = [
                'w-8 h-8 rounded-full border-2 border-transparent',
                'hover:border-primary hover:scale-110 transition-all',
                'cursor-pointer',
            ].join(' ');
            $slot.style.background = hslToCss(pc.color);
            $slot.title = pc.label ?? hslToCss(pc.color);
            $slot.addEventListener('click', () => this.onColorSlotClick(pc));
            $grid.appendChild($slot);
        });

        this.$slotPanel.appendChild($grid);

        // + 새 색상 버튼
        const $addColor = document.createElement('button');
        $addColor.className = [
            'w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/40',
            'flex items-center justify-center text-muted-foreground text-base',
            'hover:border-primary hover:text-primary transition-colors',
        ].join(' ');
        $addColor.textContent = '+';
        $addColor.title = '새 색상 추가';
        $addColor.addEventListener('click', () => this.onAddColor());
        $grid.appendChild($addColor);
    }
}
