import { animate } from 'motion';
import type { Settings, ColorSpace } from '@/types/settings';

const COLOR_SPACES: { value: ColorSpace; label: string }[] = [
    { value: 'oklch', label: 'OKLCH' },
    { value: 'oklab', label: 'OKLab' },
    { value: 'lch',   label: 'LCH' },
    { value: 'lab',   label: 'LAB' },
    { value: 'hsl',   label: 'HSL' },
    { value: 'hsv',   label: 'HSV' },
    { value: 'rgb',   label: 'RGB' },
    { value: 'lrgb',  label: 'Linear RGB' },
];

export default class SettingsPanel {
    private $el: HTMLDivElement;
    private $anchor: HTMLElement | null = null;
    private isOpen = false;
    private settings: Settings;
    private readonly onChange: (s: Settings) => void;
    private readonly onOpenChange: (open: boolean) => void;

    constructor({ $target, initSettings, onChange, onOpenChange }: {
        $target: HTMLElement;
        initSettings: Settings;
        onChange: (s: Settings) => void;
        onOpenChange: (open: boolean) => void;
    }) {
        this.settings = initSettings;
        this.onChange = onChange;
        this.onOpenChange = onOpenChange;

        this.$el = document.createElement('div');
        Object.assign(this.$el.style, {
            position: 'fixed',
            zIndex: '45',
            width: '272px',
            display: 'none',
            opacity: '0',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            boxShadow: 'var(--glass-shadow)',
            padding: '14px',
            userSelect: 'none',
        });

        $target.appendChild(this.$el);

        // anchor(설정 버튼) 위 클릭은 무시한다.
        // 무시하지 않으면 capture 단계 pointerdown이 먼저 close()를 호출하고,
        // 직후 버튼 click이 toggle()을 호출해 다시 열려버리는 버그가 생긴다.
        document.addEventListener('pointerdown', (e) => {
            if (!this.isOpen) return;
            const t = e.target as Node;
            if (this.$el.contains(t)) return;
            if (this.$anchor?.contains(t)) return;
            this.close();
        }, { capture: true });
    }

    toggle(anchor: HTMLElement) {
        this.$anchor = anchor;
        this.isOpen ? this.close() : this.open(anchor.getBoundingClientRect());
    }

    setState(settings: Settings) {
        this.settings = settings;
    }

    private open(anchorRect: DOMRect) {
        this.isOpen = true;
        this.onOpenChange(true);
        this.buildDOM();
        this.$el.style.display = 'block';
        this.reposition(anchorRect);
        animate(this.$el, { opacity: 1, scale: [0.96, 1] }, { duration: 0.18, ease: 'easeOut' });
    }

    private close() {
        if (!this.isOpen) return;
        this.isOpen = false;
        this.onOpenChange(false);
        animate(this.$el, { opacity: 0, scale: 0.96 }, { duration: 0.14, ease: 'easeIn' }).finished.then(() => {
            if (!this.isOpen) this.$el.style.display = 'none';
        });
    }

    private reposition(anchorRect: DOMRect) {
        const W = 272;
        const MARGIN = 10;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const panelH = this.$el.getBoundingClientRect().height || 320;

        let x = anchorRect.left + anchorRect.width / 2 - W / 2;
        x = Math.max(MARGIN, Math.min(x, vw - W - MARGIN));

        const spaceBelow = vh - anchorRect.bottom;
        const y = spaceBelow >= panelH + MARGIN
            ? anchorRect.bottom + MARGIN
            : Math.max(MARGIN, anchorRect.top - panelH - MARGIN);

        this.$el.style.left = `${x}px`;
        this.$el.style.top = `${y}px`;
    }

    private buildDOM() {
        this.$el.innerHTML = '';

        const header = el('div', {
            fontSize: '12px', fontWeight: '600',
            color: 'var(--glass-text-label)', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '12px',
        });
        header.textContent = '설정';
        this.$el.appendChild(header);

        this.appendSectionLabel('빗방울', true);
        this.appendSlider('속도', this.settings.rain.speed, 1, 20, 1, v =>
            this.emit({ rain: { ...this.settings.rain, speed: v } }));
        this.appendSlider('밀도', this.settings.rain.density, 1, 20, 1, v =>
            this.emit({ rain: { ...this.settings.rain, density: v } }));
        this.appendSlider('크기', this.settings.rain.size, 1, 20, 1, v =>
            this.emit({ rain: { ...this.settings.rain, size: v } }));
        this.appendSlider('바람', this.settings.rain.wind, -10, 10, 0.5, v =>
            this.emit({ rain: { ...this.settings.rain, wind: v } }));

        this.appendSectionLabel('버블');
        this.appendSlider('크기', this.settings.bubble.size, 1, 20, 1, v =>
            this.emit({ bubble: { ...this.settings.bubble, size: v } }));

        this.appendSectionLabel('색상 혼합');
        this.appendColorSpaceSelect();
        this.appendToggle('Hex 항상 표시', this.settings.showHexAlways, v =>
            this.emit({ showHexAlways: v }));

    }

    private emit(partial: Partial<Settings>) {
        this.settings = { ...this.settings, ...partial };
        this.onChange(this.settings);
    }

    private appendSectionLabel(text: string, isFirst = false) {
        const label = el('div', {
            fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em',
            color: 'var(--glass-text-label)', textTransform: 'uppercase',
            marginTop: isFirst ? '0' : '14px', marginBottom: '6px',
        });
        label.textContent = text;
        this.$el.appendChild(label);
    }

    private appendSlider(label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void) {
        const row = el('div', { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' });

        const lbl = el('span', { fontSize: '12px', color: 'var(--glass-text)', minWidth: '30px' });
        lbl.textContent = label;

        const input = document.createElement('input');
        input.type = 'range';
        input.min = String(min); input.max = String(max);
        input.step = String(step); input.value = String(value);
        Object.assign(input.style, { flex: '1', cursor: 'pointer', accentColor: 'var(--glass-text)' });

        const val = el('span', { fontSize: '11px', color: 'var(--glass-text-dim)', minWidth: '26px', textAlign: 'right' });
        val.textContent = String(value);

        input.addEventListener('input', () => {
            const v = parseFloat(input.value);
            val.textContent = String(v);
            onChange(v);
        });

        row.append(lbl, input, val);
        this.$el.appendChild(row);
    }

    private appendColorSpaceSelect() {
        const row = el('div', { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' });

        const lbl = el('span', { fontSize: '12px', color: 'var(--glass-text)', minWidth: '50px' });
        lbl.textContent = '방식';

        const select = document.createElement('select');
        Object.assign(select.style, {
            flex: '1', fontSize: '12px', padding: '3px 6px',
            borderRadius: '6px', border: '1px solid var(--glass-sep)',
            background: 'var(--glass-select-bg)', color: 'var(--glass-text)',
            cursor: 'pointer',
        });

        COLOR_SPACES.forEach(({ value, label }) => {
            const opt = document.createElement('option');
            opt.value = value; opt.textContent = label;
            opt.selected = value === this.settings.colorSpace;
            select.appendChild(opt);
        });

        select.addEventListener('change', () => this.emit({ colorSpace: select.value as ColorSpace }));

        row.append(lbl, select);
        this.$el.appendChild(row);
    }

    private appendToggle(label: string, checked: boolean, onChange: (v: boolean) => void) {
        const row = el('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' });

        const lbl = el('span', { fontSize: '12px', color: 'var(--glass-text)' });
        lbl.textContent = label;

        row.append(lbl, this.makeToggleSwitch(checked, onChange));
        this.$el.appendChild(row);
    }

    private makeToggleSwitch(checked: boolean, onChange: (v: boolean) => void): HTMLElement {
        const wrap = el('label', { position: 'relative', display: 'inline-block', width: '32px', height: '18px', cursor: 'pointer' });

        const input = document.createElement('input');
        input.type = 'checkbox'; input.checked = checked;
        Object.assign(input.style, { opacity: '0', width: '0', height: '0', position: 'absolute' });

        const track = el('span', {
            position: 'absolute', inset: '0', borderRadius: '18px',
            background: checked ? 'var(--glass-toggle-on)' : 'var(--glass-toggle-off)',
            transition: 'background 0.2s',
        });

        const thumb = el('span', {
            position: 'absolute', width: '14px', height: '14px', borderRadius: '50%',
            background: 'white', top: '2px', left: checked ? '16px' : '2px',
            transition: 'left 0.2s',
        });

        input.addEventListener('change', () => {
            const v = input.checked;
            track.style.background = v ? 'var(--glass-toggle-on)' : 'var(--glass-toggle-off)';
            thumb.style.left = v ? '16px' : '2px';
            onChange(v);
        });

        wrap.append(input, track, thumb);
        return wrap;
    }

}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, styles: Partial<CSSStyleDeclaration>): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    Object.assign(node.style, styles);
    return node;
}
