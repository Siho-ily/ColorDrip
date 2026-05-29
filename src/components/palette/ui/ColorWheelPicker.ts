import chroma from 'chroma-js';
import type { State } from "@/types/state";
import type { HslColor } from "@/types/bubble";
import type { ColorNotation } from "@/types/settings";

/**
 * 색상 선택 모달. 표기 방식(notation)에 따라 입력 UI가 전환된다.
 *
 * - hex   : 단일 텍스트 input (#RRGGBB)
 * - rgb   : R/G/B 슬라이더 (0–255)
 * - hsl   : H/S/L 슬라이더 (각각 0–360 / 0–100 / 0–100)
 * - oklch : L/C/H 슬라이더 (각각 0–100% / 0–0.4 / 0–360)
 *
 * 모든 입력은 내부적으로 chroma-js로 HslColor로 정규화되어 저장된다.
 * 외부에는 항상 HslColor만 노출한다.
 */

const NOTATION_OPTIONS: { value: ColorNotation; label: string }[] = [
    { value: 'hex',   label: 'HEX' },
    { value: 'rgb',   label: 'RGB' },
    { value: 'hsl',   label: 'HSL' },
    { value: 'oklch', label: 'OKLCH' },
];

export default class ColorWheelPicker {
    private $el: HTMLDivElement;
    private $card: HTMLDivElement;
    private $notationRow: HTMLDivElement;
    private $inputs: HTMLDivElement;
    private $preview: HTMLDivElement;
    private current: HslColor = { h: 0, s: 100, l: 50 };
    private notation: ColorNotation = 'hex';
    private onColorSelect: ((color: HslColor) => void) | null = null;
    private readonly onPickerNotationChange: ((n: ColorNotation) => void) | undefined;

    constructor({
        $target,
        onPickerNotationChange,
    }: {
        $target: HTMLElement;
        onPickerNotationChange?: (n: ColorNotation) => void;
    }) {
        this.onPickerNotationChange = onPickerNotationChange;

        this.$el = document.createElement('div');
        this.$el.className = [
            'fixed inset-0 z-50 flex items-center justify-center hidden',
            'bg-black/40 backdrop-blur-sm',
        ].join(' ');
        $target.appendChild(this.$el);

        this.$card = document.createElement('div');
        this.$card.className = 'bg-background border border-border rounded-xl shadow-xl p-5 w-64 flex flex-col gap-4';
        this.$el.appendChild(this.$card);

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
        this.$card.appendChild($header);

        // 미리보기
        this.$preview = document.createElement('div');
        this.$preview.className = 'w-full h-14 rounded-lg border border-border';
        this.$card.appendChild(this.$preview);

        // 표기 방식 스위처
        this.$notationRow = document.createElement('div');
        this.$notationRow.className = 'flex gap-1 p-1 bg-muted rounded-lg';
        this.$card.appendChild(this.$notationRow);

        // 입력 UI 컨테이너 — notation에 따라 buildInputs()가 채운다
        this.$inputs = document.createElement('div');
        this.$inputs.className = 'flex flex-col gap-3';
        this.$card.appendChild(this.$inputs);

        // 확인 버튼
        const $confirmBtn = document.createElement('button');
        $confirmBtn.className = [
            'w-full py-2 rounded-lg bg-primary text-primary-foreground',
            'text-sm font-medium hover:opacity-90 transition-opacity',
        ].join(' ');
        $confirmBtn.textContent = '추가';
        $confirmBtn.addEventListener('click', () => {
            this.onColorSelect?.(this.current);
            this.close();
        });
        this.$card.appendChild($confirmBtn);

        // 배경 클릭으로 닫기
        this.$el.addEventListener('click', (e) => {
            if (e.target === this.$el) this.close();
        });

        this.buildNotationSwitcher();
        this.buildInputs();
        this.updatePreview();
    }

    private buildNotationSwitcher() {
        this.$notationRow.innerHTML = '';
        NOTATION_OPTIONS.forEach(({ value, label }) => {
            const $btn = document.createElement('button');
            $btn.textContent = label;
            $btn.className = [
                'flex-1 py-1 text-xs rounded-md font-medium transition-colors',
                value === this.notation
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
            ].join(' ');
            $btn.addEventListener('click', () => {
                this.notation = value;
                this.buildNotationSwitcher();
                this.buildInputs();
                this.onPickerNotationChange?.(value);
            });
            this.$notationRow.appendChild($btn);
        });
    }

    /** 표기 방식에 맞는 입력 컨트롤을 새로 생성. this.current를 기준으로 초기값을 채운다. */
    private buildInputs() {
        this.$inputs.innerHTML = '';

        switch (this.notation) {
            case 'hex':
                this.buildHexInput();
                break;
            case 'rgb':
                this.buildRgbSliders();
                break;
            case 'hsl':
                this.buildHslSliders();
                break;
            case 'oklch':
                this.buildOklchSliders();
                break;
        }
    }

    private buildHexInput() {
        const $row = document.createElement('div');
        $row.className = 'flex items-center gap-2';

        const $label = document.createElement('span');
        $label.className = 'text-xs text-muted-foreground w-10 shrink-0';
        $label.textContent = 'HEX';

        const $input = document.createElement('input');
        $input.type = 'text';
        $input.value = chroma.hsl(this.current.h, this.current.s / 100, this.current.l / 100).hex();
        $input.className = [
            'flex-1 px-2 py-1 text-xs rounded border border-border',
            'bg-background text-foreground font-mono',
            'focus:outline-none focus:ring-1 focus:ring-primary',
        ].join(' ');
        $input.addEventListener('input', () => {
            const v = $input.value.trim();
            if (chroma.valid(v)) {
                const [h, s, l] = chroma(v).hsl();
                this.current = { h: h || 0, s: s * 100, l: l * 100 };
                this.updatePreview();
            }
        });

        $row.appendChild($label);
        $row.appendChild($input);
        this.$inputs.appendChild($row);
    }

    private buildRgbSliders() {
        const [r, g, b] = chroma.hsl(this.current.h, this.current.s / 100, this.current.l / 100).rgb().map(Math.round);
        const channels: { label: string; value: number }[] = [
            { label: 'R', value: r },
            { label: 'G', value: g },
            { label: 'B', value: b },
        ];
        const inputs = channels.map(c => this.buildSlider(c.label, 0, 255, 1, c.value));
        const sync = () => {
            const [hr, hg, hb] = inputs.map(i => Number(i.value));
            const [h, s, l] = chroma.rgb(hr, hg, hb).hsl();
            this.current = { h: h || 0, s: s * 100, l: l * 100 };
            this.updatePreview();
        };
        inputs.forEach(i => i.addEventListener('input', sync));
    }

    private buildHslSliders() {
        const channels: { label: string; min: number; max: number; value: number }[] = [
            { label: 'H', min: 0, max: 360, value: Math.round(this.current.h) },
            { label: 'S', min: 0, max: 100, value: Math.round(this.current.s) },
            { label: 'L', min: 0, max: 100, value: Math.round(this.current.l) },
        ];
        const inputs = channels.map(c => this.buildSlider(c.label, c.min, c.max, 1, c.value));
        const sync = () => {
            this.current = {
                h: Number(inputs[0].value),
                s: Number(inputs[1].value),
                l: Number(inputs[2].value),
            };
            this.updatePreview();
        };
        inputs.forEach(i => i.addEventListener('input', sync));
    }

    private buildOklchSliders() {
        const [ol, oc, oh] = chroma.hsl(this.current.h, this.current.s / 100, this.current.l / 100).oklch();
        const channels: { label: string; min: number; max: number; step: number; value: number }[] = [
            { label: 'L', min: 0,   max: 1,    step: 0.01,  value: Math.round((ol ?? 0) * 100) / 100 },
            { label: 'C', min: 0,   max: 0.4,  step: 0.005, value: Math.round((oc ?? 0) * 200) / 200 },
            { label: 'H', min: 0,   max: 360,  step: 1,     value: Math.round(oh ?? 0) },
        ];
        const inputs = channels.map(c => this.buildSlider(c.label, c.min, c.max, c.step, c.value));
        const sync = () => {
            const [h, s, l] = chroma.oklch(
                Number(inputs[0].value),
                Number(inputs[1].value),
                Number(inputs[2].value),
            ).hsl();
            this.current = { h: h || 0, s: (s || 0) * 100, l: (l || 0) * 100 };
            this.updatePreview();
        };
        inputs.forEach(i => i.addEventListener('input', sync));
    }

    private buildSlider(label: string, min: number, max: number, step: number, value: number): HTMLInputElement {
        const $row = document.createElement('div');
        $row.className = 'flex items-center gap-2';

        const $label = document.createElement('span');
        $label.className = 'text-xs text-muted-foreground w-4 shrink-0';
        $label.textContent = label;

        const $input = document.createElement('input');
        $input.type = 'range';
        $input.min = String(min);
        $input.max = String(max);
        $input.step = String(step);
        $input.value = String(value);
        $input.className = 'flex-1 accent-primary';

        const $val = document.createElement('span');
        $val.className = 'text-xs text-muted-foreground w-10 text-right font-mono';
        $val.textContent = String(value);
        $input.addEventListener('input', () => { $val.textContent = $input.value; });

        $row.appendChild($label);
        $row.appendChild($input);
        $row.appendChild($val);
        this.$inputs.appendChild($row);

        return $input;
    }

    private updatePreview() {
        const { h, s, l } = this.current;
        this.$preview.style.background = `hsl(${h}, ${s}%, ${l}%)`;
    }

    open(onColorSelect: (color: HslColor) => void, initialColor?: HslColor) {
        if (initialColor) {
            this.current = { ...initialColor };
        }
        this.onColorSelect = onColorSelect;
        this.$el.classList.remove('hidden');
        this.buildNotationSwitcher();
        this.buildInputs();
        this.updatePreview();
    }

    close() {
        this.$el.classList.add('hidden');
        this.onColorSelect = null;
    }

    setState(state: State) {
        const prev = this.notation;
        this.notation = state.settings.pickerNotation;
        if (prev !== this.notation && !this.$el.classList.contains('hidden')) {
            this.buildNotationSwitcher();
            this.buildInputs();
        }
    }
}
