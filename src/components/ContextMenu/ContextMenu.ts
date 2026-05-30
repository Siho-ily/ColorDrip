/**
 * 범용 컨텍스트 메뉴 컴포넌트.
 *
 * show(anchor, items)를 호출하면 anchor DOMRect 옆에 메뉴가 열린다.
 * 오른쪽 공간이 부족하면 자동으로 왼쪽에 배치된다.
 * 메뉴 바깥 클릭이나 Escape로 닫힌다.
 */
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

    // 클래스 필드로 선언한 이유: 화살표 함수는 this가 항상 인스턴스를 가리키므로
    // removeEventListener에 같은 함수 참조를 전달할 수 있다.
    // 일반 함수를 addEventListener에 넘기면 나중에 제거하려 할 때 참조가 달라서 실패한다.
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
        // document.body에 붙인다. 부모 요소의 overflow:hidden이나 z-index 스택에서 벗어나기 위해.
        document.body.appendChild(this.$el);
    }

    show(anchor: DOMRect, items: MenuItemDef[]) {
        this.closeSubmenu();
        this.$el.innerHTML = '';
        this.renderItems(items, this.$el);

        // 위치 계산 전에 hidden을 풀어야 getBoundingClientRect()가 실제 크기를 반환한다.
        // visibility: hidden으로 숨겨서 잠깐 레이아웃만 계산하고 사용자에겐 보이지 않게 한다.
        this.$el.style.visibility = 'hidden';
        this.$el.style.left = '0px';
        this.$el.style.top = '0px';
        this.$el.classList.remove('hidden');

        const { width: menuW, height: menuH } = this.$el.getBoundingClientRect();
        const gap = 8;
        const pad = 8;

        // anchor 오른쪽에 메뉴가 들어갈 공간이 있으면 오른쪽, 없으면 왼쪽에 배치
        const goRight = anchor.right + gap + menuW <= window.innerWidth - pad;
        const x = goRight ? anchor.right + gap : anchor.left - menuW - gap;

        // anchor의 수직 중앙에 맞추되, 화면 위아래 패딩(8px)을 넘지 않도록 clamp
        let y = anchor.top + anchor.height / 2 - menuH / 2;
        y = Math.max(pad, Math.min(y, window.innerHeight - menuH - pad));

        this.$el.style.left = `${x}px`;
        this.$el.style.top = `${y}px`;
        // scale 애니메이션의 기준점을 메뉴가 열리는 방향으로 설정해 자연스럽게 보이게 한다.
        this.$el.style.transformOrigin = goRight ? 'left center' : 'right center';
        this.$el.style.visibility = '';

        // 이전 애니메이션이 진행 중이라면 취소하고 새로 시작한다. (연속 호출 시 겹침 방지)
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
            const isDisabled = item.kind === 'action' && item.disabled;
            const baseColor = isDanger ? 'text-destructive' : 'text-[var(--cm-fg)]';
            const hover = isDisabled ? '' : (isDanger ? 'hover:bg-destructive/10' : 'hover:bg-[var(--cm-hover)]');
            const dim = isDisabled ? 'opacity-40 cursor-not-allowed' : '';
            $item.className = `${ITEM_CLASS} ${baseColor} ${hover} ${dim}`;

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
                    // 커서가 서브메뉴 쪽으로 이동한 경우라면 닫지 않는다.
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
                    // 일반 아이템에 마우스가 올라오면 열려 있던 서브메뉴를 닫는다.
                    // inSubmenu(서브메뉴 안의 아이템)에서는 닫으면 안 된다.
                    if (!inSubmenu) this.closeSubmenu();
                });
                if (!isDisabled) {
                    $item.addEventListener('click', () => {
                        item.onSelect();
                        this.hide();
                    });
                }
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

        // 초기 위치를 잡은 뒤 실제 렌더 크기를 보고 화면 밖으로 넘치면 보정한다.
        // requestAnimationFrame: DOM이 그려진 다음 프레임에 getBoundingClientRect()를 호출해야
        // 정확한 크기를 얻을 수 있다. 동기적으로 호출하면 크기가 0일 수 있다.
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
            // 커서가 부모 메뉴로 돌아온 경우라면 닫지 않는다.
            if (!this.$el.contains(e.relatedTarget as Node)) this.closeSubmenu();
        });
    }

    private closeSubmenu() {
        this.$submenu?.remove();
        this.$submenu = null;
    }
}
