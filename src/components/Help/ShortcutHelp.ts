import { animate } from 'motion';
import { el } from '@/lib/dom';

/** 한 단축키 행: 키 캡(들) + 설명 */
interface Shortcut {
    keys: string[];   // 키 캡 라벨 목록 (예: ['⌘', 'A'] 또는 ['['] )
    label: string;
}

interface Group {
    title: string;
    items: Shortcut[];
}

// macOS면 ⌘, 그 외엔 Ctrl로 수식어를 표기한다.
const IS_MAC = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const MOD = IS_MAC ? '⌘' : 'Ctrl';

const GROUPS: Group[] = [
    {
        title: '전역',
        items: [
            { keys: ['R'], label: '빗방울 켜기/끄기' },
            { keys: ['P'], label: '팔레트 열기/닫기' },
            { keys: ['D'], label: '다크 모드' },
            { keys: [MOD, ','], label: '설정' },
            { keys: ['?'], label: '단축키 도움말' },
            { keys: ['Esc'], label: '선택 해제 / 닫기' },
        ],
    },
    {
        title: '선택한 버블',
        items: [
            { keys: ['Delete'], label: '삭제' },
            { keys: [MOD, 'A'], label: '모든 버블 선택' },
            { keys: ['M'], label: '혼합 (2개 이상)' },
            { keys: [MOD, 'D'], label: '복제' },
            { keys: ['F'], label: '위치 고정/해제' },
            { keys: [MOD, 'S'], label: '팔레트에 저장' },
        ],
    },
    {
        title: '선택한 색상',
        items: [
            { keys: ['Delete'], label: '삭제' },
            { keys: ['Enter'], label: '캔버스에 추가' },
        ],
    },
    {
        title: '생성 · 프리셋',
        items: [
            { keys: ['N'], label: '새 버블' },
            { keys: ['⇧', 'N'], label: '새 프리셋' },
            { keys: ['[', ']'], label: '이전/다음 프리셋' },
        ],
    },
];

export default class ShortcutHelp {
    private $backdrop: HTMLDivElement;
    private $panel: HTMLDivElement;
    private isOpenFlag = false;

    constructor({ $target }: { $target: HTMLElement }) {
        this.$backdrop = document.createElement('div');
        Object.assign(this.$backdrop.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '60',
            display: 'none',
            opacity: '0',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
        });

        this.$panel = document.createElement('div');
        Object.assign(this.$panel.style, {
            width: 'min(560px, calc(100vw - 32px))',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '18px',
            boxShadow: 'var(--glass-shadow)',
            padding: '20px 22px',
            userSelect: 'none',
        });

        this.buildDOM();
        this.$backdrop.appendChild(this.$panel);
        $target.appendChild(this.$backdrop);

        // 백드롭(패널 바깥) 클릭 시 닫기
        this.$backdrop.addEventListener('pointerdown', (e) => {
            if (e.target === this.$backdrop) this.close();
        });
    }

    isOpen(): boolean {
        return this.isOpenFlag;
    }

    toggle() {
        this.isOpenFlag ? this.close() : this.open();
    }

    open() {
        if (this.isOpenFlag) return;
        this.isOpenFlag = true;
        this.$backdrop.style.display = 'flex';
        animate(this.$backdrop, { opacity: 1 }, { duration: 0.15, ease: 'easeOut' });
        animate(this.$panel, { scale: [0.96, 1] }, { duration: 0.18, ease: 'easeOut' });
    }

    close() {
        if (!this.isOpenFlag) return;
        this.isOpenFlag = false;
        animate(this.$backdrop, { opacity: 0 }, { duration: 0.13, ease: 'easeIn' }).finished.then(() => {
            if (!this.isOpenFlag) this.$backdrop.style.display = 'none';
        });
    }

    private buildDOM() {
        const header = el('div', {
            fontSize: '13px', fontWeight: '600',
            color: 'var(--glass-text-label)', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: '16px',
        });
        header.textContent = '단축키';
        this.$panel.appendChild(header);

        const grid = el('div', {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '18px 28px',
        });

        GROUPS.forEach(group => grid.appendChild(this.buildGroup(group)));
        this.$panel.appendChild(grid);
    }

    private buildGroup(group: Group): HTMLDivElement {
        const wrap = el('div', {});

        const title = el('div', {
            fontSize: '10px', fontWeight: '600', letterSpacing: '0.07em',
            color: 'var(--glass-text-label)', textTransform: 'uppercase', marginBottom: '8px',
        });
        title.textContent = group.title;
        wrap.appendChild(title);

        group.items.forEach(item => {
            const row = el('div', {
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: '12px', marginBottom: '7px',
            });

            const label = el('span', { fontSize: '12px', color: 'var(--glass-text)' });
            label.textContent = item.label;

            const keys = el('span', { display: 'flex', gap: '3px', flexShrink: '0' });
            item.keys.forEach(k => keys.appendChild(this.kbd(k)));

            row.append(label, keys);
            wrap.appendChild(row);
        });

        return wrap;
    }

    private kbd(text: string): HTMLElement {
        const cap = el('kbd', {
            minWidth: '20px',
            height: '20px',
            padding: '0 6px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontFamily: 'inherit',
            color: 'var(--glass-text)',
            background: 'var(--glass-select-bg)',
            border: '1px solid var(--glass-sep)',
            borderRadius: '6px',
        });
        cap.textContent = text;
        return cap;
    }
}
