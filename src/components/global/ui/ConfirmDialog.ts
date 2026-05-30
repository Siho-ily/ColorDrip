import { createModalShell } from '@/lib/modalShell';

export default class ConfirmDialog {
    private $el: HTMLDivElement;
    private $message: HTMLParagraphElement;
    private $checkbox: HTMLInputElement;
    private onConfirm: (() => void) | null = null;
    private readonly storageKey: string;

    private readonly keyHandler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') { e.stopPropagation(); this.close(); }
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); this.confirm(); }
    };

    constructor({ title, confirmLabel = '삭제', checkboxLabel = '다음부터 확인하지 않고 삭제하기', storageKey }: {
        title: string;
        confirmLabel?: string;
        checkboxLabel?: string;
        storageKey: string;
    }) {
        this.storageKey = storageKey;

        const { $overlay, $card } = createModalShell({
            zIndex: 'z-[70]',
            cardSize: 'p-5 w-72 gap-4',
            onBackdropClick: () => this.close(),
        });
        this.$el = $overlay;

        const $title = document.createElement('p');
        $title.className = 'text-sm font-semibold text-foreground';
        $title.textContent = title;
        $card.appendChild($title);

        this.$message = document.createElement('p');
        this.$message.className = 'text-sm text-muted-foreground -mt-2';
        $card.appendChild(this.$message);

        // 체크박스 행
        const $checkRow = document.createElement('label');
        $checkRow.className = 'flex items-center gap-2 cursor-pointer';

        this.$checkbox = document.createElement('input');
        this.$checkbox.type = 'checkbox';
        this.$checkbox.className = 'w-3.5 h-3.5 rounded accent-destructive cursor-pointer shrink-0';

        const $checkLabel = document.createElement('span');
        $checkLabel.className = 'text-xs text-muted-foreground select-none';
        $checkLabel.textContent = checkboxLabel;

        $checkRow.appendChild(this.$checkbox);
        $checkRow.appendChild($checkLabel);
        $card.appendChild($checkRow);

        // 버튼 행
        const $buttons = document.createElement('div');
        $buttons.className = 'flex gap-2 justify-end';
        $card.appendChild($buttons);

        const $cancel = document.createElement('button');
        $cancel.className = 'px-3 py-1.5 rounded-lg text-sm text-foreground hover:bg-accent transition-colors';
        $cancel.textContent = '취소';
        $cancel.addEventListener('click', () => this.close());

        const $confirm = document.createElement('button');
        $confirm.className = 'px-3 py-1.5 rounded-lg text-sm font-medium bg-destructive text-white hover:opacity-90 transition-opacity';
        $confirm.textContent = confirmLabel;
        $confirm.addEventListener('click', () => this.confirm());

        $buttons.appendChild($cancel);
        $buttons.appendChild($confirm);
    }

    /** skip 설정이 있으면 모달 없이 바로 실행, 아니면 모달 표시 */
    open(message: string, onConfirm: () => void) {
        if (localStorage.getItem(this.storageKey) === 'true') {
            onConfirm();
            return;
        }
        this.onConfirm = onConfirm;
        this.$message.textContent = message;
        this.$checkbox.checked = false;
        this.$el.classList.remove('hidden');
        document.addEventListener('keydown', this.keyHandler, { capture: true });
    }

    private confirm() {
        if (this.$checkbox.checked) {
            localStorage.setItem(this.storageKey, 'true');
        }
        this.onConfirm?.();
        this.close();
    }

    close() {
        this.$el.classList.add('hidden');
        document.removeEventListener('keydown', this.keyHandler, { capture: true });
        this.onConfirm = null;
    }

    get isOpen() {
        return !this.$el.classList.contains('hidden');
    }
}
