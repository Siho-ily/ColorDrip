import type { State } from "@/types/state";

/** 사이드바 너비 (탭바 w-16 64px + 슬롯패널 w-52 208px = 272px) */
const SIDEBAR_WIDTH = 272;
const COLLAPSED_RIGHT = 16; // top-4 = 1rem

export default class PaletteToggleButton {
    private $el: HTMLButtonElement;
    private readonly onToggle: () => void;

    constructor({ $target, onToggle }: { $target: HTMLElement; onToggle: () => void }) {
        this.onToggle = onToggle;

        this.$el = document.createElement('button');
        this.$el.className = [
            'fixed top-4 z-40',
            'w-10 h-10 rounded-full flex items-center justify-center',
            'bg-background/80 backdrop-blur border border-border',
            'shadow-sm hover:bg-accent text-foreground',
            'transition-[right,background-color] duration-200',
        ].join(' ');
        this.$el.style.right = `${COLLAPSED_RIGHT}px`;
        this.$el.title = '팔레트 열기/닫기';

        this.$el.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
                <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
                <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
                <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
            </svg>
        `;

        this.$el.addEventListener('click', () => this.onToggle());
        $target.appendChild(this.$el);
    }

    setState(state: State) {
        const { open } = state.palette;

        // 트레이가 열리면 버튼이 트레이 왼쪽 옆으로 이동
        this.$el.style.right = open
            ? `${SIDEBAR_WIDTH + COLLAPSED_RIGHT}px`
            : `${COLLAPSED_RIGHT}px`;

        if (open) {
            this.$el.classList.add('bg-accent');
            this.$el.classList.remove('bg-background/80');
        } else {
            this.$el.classList.remove('bg-accent');
            this.$el.classList.add('bg-background/80');
        }
    }
}
