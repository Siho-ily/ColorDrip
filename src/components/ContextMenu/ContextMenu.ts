import { animate } from 'motion';
import type { AnimationPlaybackControls } from 'motion';
import type { MenuItemDef } from '@/types/menu';

const MENU_CLASS =
    'fixed py-2 min-w-44 bg-[var(--cm-bg)] border border-[var(--cm-border)] rounded-lg select-none shadow-md';

const ITEM_CLASS =
    'flex items-center justify-between gap-3 px-3 py-2 mx-2 rounded text-sm cursor-pointer';

export default class ContextMenu {
    private $el: HTMLDivElement;
    private $submenu: HTMLDivElement | null = null;
    private popAnimation: AnimationPlaybackControls | null = null;
    private readonly onClose: () => void;

    private readonly outsideHandler = (e: PointerEvent) => {
        const t = e.target as Node;
        if (!this.$el.contains(t) && !this.$submenu?.contains(t)) this.hide();
    };

    private readonly keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') this.hide();
    };

    constructor({ onClose }: { onClose: () => void }) {
        this.onClose = onClose;
        this.$el = document.createElement('div');
        this.$el.className = `${MENU_CLASS} z-50 hidden`;
        document.body.appendChild(this.$el);
    }

    show(anchor: DOMRect, items: MenuItemDef[]) {
        this.closeSubmenu();
        this.$el.innerHTML = '';
        this.renderItems(items, this.$el);

        this.$el.style.visibility = 'hidden';
        this.$el.style.left = '0px';
        this.$el.style.top = '0px';
        this.$el.classList.remove('hidden');

        const { width: menuW, height: menuH } = this.$el.getBoundingClientRect();
        const gap = 8;
        const pad = 8;

        const goRight = anchor.right + gap + menuW <= window.innerWidth - pad;
        const x = goRight ? anchor.right + gap : anchor.left - menuW - gap;

        let y = anchor.top + anchor.height / 2 - menuH / 2;
        y = Math.max(pad, Math.min(y, window.innerHeight - menuH - pad));

        this.$el.style.left = `${x}px`;
        this.$el.style.top = `${y}px`;
        this.$el.style.transformOrigin = goRight ? 'left center' : 'right center';
        this.$el.style.visibility = '';

        this.popAnimation?.cancel();
        this.popAnimation = animate(
            this.$el,
            { scale: [0.85, 1], opacity: [0, 1] },
            { type: 'spring', stiffness: 400, damping: 17, mass: 0.8 },
        );

        document.addEventListener('pointerdown', this.outsideHandler, { capture: true });
        document.addEventListener('keydown', this.keyHandler);
    }

    hide() {
        if (this.$el.classList.contains('hidden')) return;
        this.popAnimation?.cancel();
        this.popAnimation = null;
        this.$el.classList.add('hidden');
        this.closeSubmenu();
        document.removeEventListener('pointerdown', this.outsideHandler, { capture: true });
        document.removeEventListener('keydown', this.keyHandler);
        this.onClose();
    }

    private renderItems(items: MenuItemDef[], $container: HTMLElement, inSubmenu = false) {
        for (const item of items) {
            if (item.kind === 'separator') {
                const $sep = document.createElement('div');
                $sep.className = 'my-2 mx-2 border-t border-[var(--cm-border)]';
                $container.appendChild($sep);
                continue;
            }

            const $item = document.createElement('div');
            const isDanger = item.kind === 'action' && item.danger;
            $item.className = `${ITEM_CLASS} ${isDanger ? 'text-destructive hover:bg-destructive/10' : 'text-[var(--cm-fg)] hover:bg-[var(--cm-hover)]'}`;

            const $label = document.createElement('span');
            $label.textContent = item.label;
            $item.appendChild($label);

            if (item.kind === 'submenu') {
                const $arrow = document.createElement('span');
                $arrow.textContent = '›';
                $arrow.className = 'text-base leading-none opacity-40';
                $item.appendChild($arrow);

                $item.addEventListener('mouseenter', () => {
                    this.openSubmenu($item, item.items);
                });
                $item.addEventListener('mouseleave', (e) => {
                    if (!this.$submenu?.contains(e.relatedTarget as Node)) this.closeSubmenu();
                });
            } else {
                if (item.hint) {
                    const $hint = document.createElement('span');
                    $hint.textContent = item.hint;
                    $hint.className = 'text-xs text-[var(--cm-muted)] font-mono';
                    $item.appendChild($hint);
                }

                $item.addEventListener('mouseenter', () => {
                    if (!inSubmenu) this.closeSubmenu();
                });
                $item.addEventListener('click', () => {
                    item.onSelect();
                    this.hide();
                });
            }

            $container.appendChild($item);
        }
    }

    private openSubmenu($trigger: HTMLElement, items: MenuItemDef[]) {
        this.closeSubmenu();

        this.$submenu = document.createElement('div');
        this.$submenu.className = `${MENU_CLASS} z-[51]`;
        this.renderItems(items, this.$submenu, true);

        const rect = $trigger.getBoundingClientRect();
        this.$submenu.style.left = `${rect.right}px`;
        this.$submenu.style.top = `${rect.top}px`;
        document.body.appendChild(this.$submenu);

        // 오른쪽 공간이 부족하면 왼쪽에 딱 붙임
        requestAnimationFrame(() => {
            if (!this.$submenu) return;
            const sub = this.$submenu.getBoundingClientRect();
            const pad = 8;
            if (sub.right > window.innerWidth - pad) {
                this.$submenu.style.left = `${rect.left - sub.width}px`;
            }
            if (sub.bottom > window.innerHeight - pad) {
                this.$submenu.style.top = `${window.innerHeight - sub.height - pad}px`;
            }
        });

        this.$submenu.addEventListener('mouseleave', (e) => {
            if (!this.$el.contains(e.relatedTarget as Node)) this.closeSubmenu();
        });
    }

    private closeSubmenu() {
        this.$submenu?.remove();
        this.$submenu = null;
    }
}
