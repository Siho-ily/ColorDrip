import { animate } from 'motion';
import type { AnimationPlaybackControls } from 'motion';
import type { MenuItemDef } from '@/types/menu';

const MENU_CLASS =
    'fixed py-1 min-w-44 bg-zinc-900 border border-white/10 rounded-lg  select-none'; //shadow-2xl shadow-black/60

const ITEM_CLASS =
    'flex items-center justify-between gap-3 px-3 py-1.5 mx-1 rounded text-sm cursor-pointer';

export default class ContextMenu {
    private $el: HTMLDivElement;
    private $submenu: HTMLDivElement | null = null;
    private popAnimation: AnimationPlaybackControls | null = null;
    private closeSubmenuTimer: ReturnType<typeof setTimeout> | null = null;
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

        // display: none 상태에선 getBoundingClientRect가 0을 반환하므로
        // visibility: hidden으로 먼저 렌더링해 치수를 잰 뒤 위치를 확정한다.
        // 이렇게 해야 잘못된 위치에 잠깐 나타났다 이동하는 flicker가 없다.
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
        // pop 애니메이션이 버블 쪽에서 시작되는 것처럼 보이도록 origin을 버블 방향으로 설정
        this.$el.style.transformOrigin = goRight ? 'left center' : 'right center';
        this.$el.style.visibility = '';

        this.popAnimation?.cancel();
        this.popAnimation = animate(
            this.$el,
            { scale: [0.85, 1], opacity: [0, 1] },
            { type: 'spring', stiffness: 400, damping: 17, mass: 0.8 },
        );

        // capture: true — 버블 div의 contextmenu 핸들러보다 먼저 실행되어야
        // 메뉴 바깥 클릭이 버블 이벤트에 가려지지 않는다.
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
                $sep.className = 'my-1 border-t border-white/10';
                $container.appendChild($sep);
                continue;
            }

            const $item = document.createElement('div');
            const isDanger = item.kind === 'action' && item.danger;
            $item.className = `${ITEM_CLASS} ${isDanger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/90 hover:bg-white/10'}`;

            const $label = document.createElement('span');
            $label.textContent = item.label;
            $item.appendChild($label);

            if (item.kind === 'submenu') {
                const $arrow = document.createElement('span');
                $arrow.textContent = '›';
                $arrow.className = 'text-base leading-none opacity-40';
                $item.appendChild($arrow);

                $item.addEventListener('mouseenter', () => {
                    this.cancelCloseSubmenu();
                    this.openSubmenu($item, item.items);
                });
                $item.addEventListener('mouseleave', (e) => {
                    if (!this.$submenu?.contains(e.relatedTarget as Node)) this.scheduleCloseSubmenu();
                });
            } else {
                if (item.hint) {
                    const $hint = document.createElement('span');
                    $hint.textContent = item.hint;
                    $hint.className = 'text-xs text-white/35 font-mono';
                    $item.appendChild($hint);
                }

                $item.addEventListener('mouseenter', () => {
                    this.cancelCloseSubmenu();
                    // renderItems는 서브메뉴 항목에도 재사용된다.
                    // inSubmenu가 없으면 서브메뉴 내부 아이템의 mouseenter가
                    // closeSubmenu()를 호출해 자신이 속한 서브메뉴를 닫아버린다.
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
        this.$submenu.style.left = `${rect.right + 4}px`;
        this.$submenu.style.top = `${rect.top}px`;
        document.body.appendChild(this.$submenu);

        // 서브메뉴를 DOM에 추가한 직후엔 레이아웃이 아직 계산되지 않아
        // getBoundingClientRect가 0을 반환한다. rAF로 한 프레임 뒤에 측정한다.
        requestAnimationFrame(() => {
            if (!this.$submenu) return;
            const sub = this.$submenu.getBoundingClientRect();
            const pad = 8;
            if (sub.right > window.innerWidth - pad) {
                this.$submenu.style.left = `${rect.left - sub.width - 4}px`;
            }
            if (sub.bottom > window.innerHeight - pad) {
                this.$submenu.style.top = `${window.innerHeight - sub.height - pad}px`;
            }
        });

        this.$submenu.addEventListener('mouseenter', () => this.cancelCloseSubmenu());
        this.$submenu.addEventListener('mouseleave', (e) => {
            if (!this.$el.contains(e.relatedTarget as Node)) this.scheduleCloseSubmenu();
        });
    }

    private scheduleCloseSubmenu() {
        // 메인 메뉴와 서브메뉴 사이에 4px 갭이 있어 mouseleave가 먼저 발생한다.
        // 즉시 닫으면 갭을 지나는 동안 서브메뉴가 사라지므로 짧은 delay를 둔다.
        this.closeSubmenuTimer = setTimeout(() => this.closeSubmenu(), 120);
    }

    private cancelCloseSubmenu() {
        if (this.closeSubmenuTimer === null) return;
        clearTimeout(this.closeSubmenuTimer);
        this.closeSubmenuTimer = null;
    }

    private closeSubmenu() {
        this.cancelCloseSubmenu();
        this.$submenu?.remove();
        this.$submenu = null;
    }
}

