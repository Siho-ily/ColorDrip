import type { State } from "@/types/state";
import type { HslColor } from "@/types/bubble";

export default class ColorWheelPicker {
    private $el: HTMLDivElement;
    private $hInput: HTMLInputElement;
    private $sInput: HTMLInputElement;
    private $lInput: HTMLInputElement;
    private $preview: HTMLDivElement;
    private current: HslColor = { h: 0, s: 100, l: 50 };
    private onColorSelect: ((color: HslColor) => void) | null = null;

    constructor({ $target }: { $target: HTMLElement }) {
        this.$el = document.createElement('div');
        this.$el.className = [
            'fixed inset-0 z-50 flex items-center justify-center hidden',
            'bg-black/40 backdrop-blur-sm',
        ].join(' ');
        $target.appendChild(this.$el);

        const $card = document.createElement('div');
        $card.className = 'bg-background border border-border rounded-xl shadow-xl p-5 w-64 flex flex-col gap-4';
        this.$el.appendChild($card);

        // 헤더
        const $header = document.createElement('div');
        $header.className = 'flex items-center justify-between';
        const $title = document.createElement('span');
        $title.className = 'text-sm font-medium text-foreground';
        $title.textContent = '색상 선택';
        const $closeBtn = document.createElement('button');
        $closeBtn.className = 'text-muted-foreground hover:text-foreground text-lg leading-none';
        $closeBtn.textContent = '×';
        $closeBtn.addEventListener('click', () => this.close());
        $header.appendChild($title);
        $header.appendChild($closeBtn);
        $card.appendChild($header);

        // 미리보기
        this.$preview = document.createElement('div');
        this.$preview.className = 'w-full h-14 rounded-lg border border-border';
        $card.appendChild(this.$preview);

        // HSL 슬라이더
        const $sliders = document.createElement('div');
        $sliders.className = 'flex flex-col gap-3';
        $card.appendChild($sliders);

        this.$hInput = this.buildSlider($sliders, 'H', 0, 360, this.current.h, () => this.updatePreview());
        this.$sInput = this.buildSlider($sliders, 'S', 0, 100, this.current.s, () => this.updatePreview());
        this.$lInput = this.buildSlider($sliders, 'L', 0, 100, this.current.l, () => this.updatePreview());

        // 확인 버튼
        const $confirmBtn = document.createElement('button');
        $confirmBtn.className = [
            'w-full py-2 rounded-lg bg-primary text-primary-foreground',
            'text-sm font-medium hover:opacity-90 transition-opacity',
        ].join(' ');
        $confirmBtn.textContent = '추가';
        $confirmBtn.addEventListener('click', () => {
            this.onColorSelect?.(this.getValue());
            this.close();
        });
        $card.appendChild($confirmBtn);

        // 배경 클릭으로 닫기
        this.$el.addEventListener('click', (e) => {
            if (e.target === this.$el) this.close();
        });

        this.updatePreview();
    }

    private buildSlider(
        $container: HTMLElement,
        label: string,
        min: number,
        max: number,
        value: number,
        onChange: () => void,
    ): HTMLInputElement {
        const $row = document.createElement('div');
        $row.className = 'flex items-center gap-2';

        const $label = document.createElement('span');
        $label.className = 'text-xs text-muted-foreground w-4 shrink-0';
        $label.textContent = label;

        const $input = document.createElement('input');
        $input.type = 'range';
        $input.min = String(min);
        $input.max = String(max);
        $input.value = String(value);
        $input.className = 'flex-1 accent-primary';
        $input.addEventListener('input', onChange);

        const $val = document.createElement('span');
        $val.className = 'text-xs text-muted-foreground w-8 text-right';
        $val.textContent = String(value);
        $input.addEventListener('input', () => { $val.textContent = $input.value; });

        $row.appendChild($label);
        $row.appendChild($input);
        $row.appendChild($val);
        $container.appendChild($row);

        return $input;
    }

    private getValue(): HslColor {
        return {
            h: Number(this.$hInput.value),
            s: Number(this.$sInput.value),
            l: Number(this.$lInput.value),
        };
    }

    private updatePreview() {
        const { h, s, l } = this.getValue();
        this.$preview.style.background = `hsl(${h}, ${s}%, ${l}%)`;
    }

    open(onColorSelect: (color: HslColor) => void) {
        this.onColorSelect = onColorSelect;
        this.$el.classList.remove('hidden');
        this.updatePreview();
    }

    close() {
        this.$el.classList.add('hidden');
        this.onColorSelect = null;
    }

    setState(_state: State) {
        // picker.open은 Palette 레이어에서 직접 open()/close()로 제어
    }
}
