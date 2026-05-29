/**
 * 캔버스 우측 하단에 떠있는 글래스 스타일 + 버튼.
 *
 * 클릭 시 ColorWheelPicker를 열어 새 색상을 받아 캔버스에 버블을 생성하기 위한 트리거.
 * 팔레트 열림/닫힘과 무관하게 항상 보인다.
 */

const PLUS_ICON = `
<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
     stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="12" y1="5" x2="12" y2="19"/>
  <line x1="5" y1="12" x2="19" y2="12"/>
</svg>`.trim();

export default class CanvasAddButton {
    private $el: HTMLButtonElement;

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
        });
        this.$el.addEventListener('pointerleave', () => {
            this.$el.style.background = 'var(--glass-bg)';
        });
        this.$el.addEventListener('click', onClick);

        $target.appendChild(this.$el);
    }

    setRightOffset(paletteWidth: number) {
        this.$el.style.right = `${16 + paletteWidth}px`;
    }
}
