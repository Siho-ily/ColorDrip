import { animate } from 'motion';

const FADE_DELAY = 5000;

const PLUS_ICON = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="12" y1="5" x2="12" y2="19"/>
  <line x1="5" y1="12" x2="19" y2="12"/>
</svg>`.trim();

export default class CanvasAddButton {
    private $el: HTMLButtonElement;
    private fadeTimer: ReturnType<typeof setTimeout> | null = null;
    private currentOpacity = 1;
    private lastMousemove = 0;

    constructor({ $target, onClick }: { $target: HTMLElement; onClick: () => void }) {
        this.$el = document.createElement('button');
        this.$el.title = '색상 추가';
        this.$el.innerHTML = PLUS_ICON;
        Object.assign(this.$el.style, {
            position: 'fixed',
            right: '16px',
            bottom: '16px',
            zIndex: '50',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--glass-text)',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            boxShadow: 'var(--glass-shadow)',
            cursor: 'pointer',
            transition: 'background 0.15s, right 0.2s ease-out',
        } as Partial<CSSStyleDeclaration>);

        this.$el.addEventListener('pointerenter', () => {
            this.$el.style.background = 'var(--glass-hover)';
            this.show();
        });
        this.$el.addEventListener('pointerleave', () => {
            this.$el.style.background = 'var(--glass-bg)';
        });
        this.$el.addEventListener('click', onClick);

        document.addEventListener('mousemove', () => {
            const now = performance.now();
            if (now - this.lastMousemove < 250) return;
            this.lastMousemove = now;
            this.show();
        }, { passive: true });

        this.scheduleFade();
        $target.appendChild(this.$el);
    }

    private show() {
        this.cancelFade();
        if (this.currentOpacity < 1) {
            this.currentOpacity = 1;
            this.$el.style.pointerEvents = 'auto';
            animate(this.$el, { opacity: 1 }, { duration: 0.25 });
        }
        this.scheduleFade();
    }

    private scheduleFade() {
        this.cancelFade();
        this.fadeTimer = setTimeout(() => {
            this.fadeTimer = null;
            this.currentOpacity = 0;
            animate(this.$el, { opacity: 0 }, { duration: 0.6 }).finished.then(() => {
                if (this.currentOpacity === 0) this.$el.style.pointerEvents = 'none';
            });
        }, FADE_DELAY);
    }

    private cancelFade() {
        if (this.fadeTimer !== null) {
            clearTimeout(this.fadeTimer);
            this.fadeTimer = null;
        }
    }

    setRightOffset(paletteWidth: number) {
        this.$el.style.right = `${16 + paletteWidth}px`;
    }
}
