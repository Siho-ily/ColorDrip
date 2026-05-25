import type { Preset } from '@/types/palette';
import { hslToCss } from '@/lib/color';

export default class PresetPickerModal {
    private $el: HTMLDivElement;
    private $list: HTMLDivElement;
    private onSelect: ((presetId: string) => void) | null = null;

    private readonly keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.close();
    };

    constructor() {
        this.$el = document.createElement('div');
        this.$el.className = [
            'fixed inset-0 z-[60] flex items-center justify-center hidden',
            'bg-black/40 backdrop-blur-sm',
        ].join(' ');
        document.body.appendChild(this.$el);

        const $card = document.createElement('div');
        $card.className = 'bg-background border border-border rounded-xl shadow-xl p-4 w-56 flex flex-col gap-3';
        this.$el.appendChild($card);

        const $header = document.createElement('div');
        $header.className = 'flex items-center justify-between';

        const $title = document.createElement('span');
        $title.className = 'text-sm font-medium text-foreground';
        $title.textContent = '프리셋 선택';

        const $closeBtn = document.createElement('button');
        $closeBtn.className = 'text-muted-foreground hover:text-foreground text-lg leading-none';
        $closeBtn.textContent = '×';
        $closeBtn.addEventListener('click', () => this.close());

        $header.appendChild($title);
        $header.appendChild($closeBtn);
        $card.appendChild($header);

        this.$list = document.createElement('div');
        this.$list.className = 'flex flex-col gap-1 max-h-64 overflow-y-auto';
        $card.appendChild(this.$list);

        this.$el.addEventListener('click', (e) => {
            if (e.target === this.$el) this.close();
        });
    }

    open(presets: Preset[], onSelect: (presetId: string) => void) {
        this.onSelect = onSelect;
        this.$list.innerHTML = '';

        presets.forEach(preset => {
            const $item = document.createElement('button');
            $item.className = [
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left',
                'hover:bg-accent transition-colors',
            ].join(' ');

            const $dots = document.createElement('div');
            $dots.className = 'flex gap-0.5 shrink-0';
            preset.colors.slice(0, 4).forEach(pc => {
                const $dot = document.createElement('div');
                $dot.className = 'w-2.5 h-2.5 rounded-full shrink-0';
                $dot.style.background = hslToCss(pc.color);
                $dots.appendChild($dot);
            });
            if (preset.colors.length === 0) {
                const $dot = document.createElement('div');
                $dot.className = 'w-2.5 h-2.5 rounded-full bg-muted-foreground/30';
                $dots.appendChild($dot);
            }

            const $name = document.createElement('span');
            $name.className = 'truncate text-foreground';
            $name.textContent = preset.name;

            $item.appendChild($dots);
            $item.appendChild($name);
            $item.addEventListener('click', () => {
                this.onSelect?.(preset.id);
                this.close();
            });
            this.$list.appendChild($item);
        });

        this.$el.classList.remove('hidden');
        document.addEventListener('keydown', this.keyHandler);
    }

    close() {
        this.$el.classList.add('hidden');
        document.removeEventListener('keydown', this.keyHandler);
        this.onSelect = null;
    }
}
