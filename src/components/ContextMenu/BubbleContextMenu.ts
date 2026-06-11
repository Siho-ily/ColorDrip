import { ContextMenu } from '@/components/index';
import type { MenuItemDef } from '@/types/menu';
import type { State } from '@/types/state';
import { buildCopyColorSubmenu } from '@/lib/color';

export default class BubbleContextMenu {
    private menu: ContextMenu;
    private readonly onFreeze: (id: number) => void;
    private readonly onUnfreeze: (id: number) => void;
    private readonly onPin: (id: number) => void;
    private readonly onUnpin: (id: number) => void;
    private readonly getState: () => State;
    private readonly setState: (next: Partial<State>) => void;
    private readonly onSaveToPreset: (bubbleId: number) => void;
    private readonly onDuplicate: (bubbleId: number) => void;
    private readonly onEditColor: (bubbleId: number) => void;

    constructor({
        onFreeze,
        onUnfreeze,
        onPin,
        onUnpin,
        getState,
        setState,
        onSaveToPreset,
        onDuplicate,
        onEditColor,
    }: {
        onFreeze: (id: number) => void;
        onUnfreeze: (id: number) => void;
        onPin: (id: number) => void;
        onUnpin: (id: number) => void;
        getState: () => State;
        setState: (next: Partial<State>) => void;
        onSaveToPreset: (bubbleId: number) => void;
        onDuplicate: (bubbleId: number) => void;
        onEditColor: (bubbleId: number) => void;
    }) {
        this.onFreeze = onFreeze;
        this.onUnfreeze = onUnfreeze;
        this.onPin = onPin;
        this.onUnpin = onUnpin;
        this.getState = getState;
        this.setState = setState;
        this.onSaveToPreset = onSaveToPreset;
        this.onDuplicate = onDuplicate;
        this.onEditColor = onEditColor;

        this.menu = new ContextMenu({
            onClose: () => {
                const { bubbleId } = this.getState().contextMenu;
                if (bubbleId !== null) this.onUnfreeze(bubbleId);
                this.setState({ contextMenu: { open: false, mode: 'single', bubbleId: null, x: 0, y: 0 } });
            },
        });
    }

    open(id: number, bubbleRect: DOMRect) {
        const { bubbleId: prevId } = this.getState().contextMenu;
        if (prevId !== null) this.onUnfreeze(prevId);

        this.onFreeze(id);
        this.menu.show(bubbleRect, this.buildMenuItems(id));
        this.setState({ contextMenu: { open: true, mode: 'single', bubbleId: id, x: bubbleRect.right, y: bubbleRect.top } });
    }

    private buildMenuItems(bubbleId: number): MenuItemDef[] {
        const bubble = this.getState().bubbles.find(b => b.id === bubbleId);
        if (!bubble) return [];

        const isPinned = bubble.pinned ?? false;

        return [
            buildCopyColorSubmenu(bubble.color),
            { kind: 'separator' },
            { kind: 'action', id: 'edit-color',   label: '색상 편집',    onSelect: () => this.onEditColor(bubbleId) },
            { kind: 'action', id: 'save-palette', label: '팔레트에 저장', onSelect: () => this.onSaveToPreset(bubbleId) },
            { kind: 'action', id: 'duplicate',    label: '버블 복제',    onSelect: () => this.onDuplicate(bubbleId) },
            { kind: 'separator' },
            {
                kind: 'action',
                id: 'pin',
                label: isPinned ? '고정 해제' : '위치 고정',
                onSelect: () => {
                    if (isPinned) {
                        this.onUnpin(bubbleId);
                        this.setState({
                            bubbles: this.getState().bubbles.map(b =>
                                b.id === bubbleId ? { ...b, pinned: false } : b
                            ),
                        });
                    } else {
                        this.onPin(bubbleId);
                        this.setState({
                            bubbles: this.getState().bubbles.map(b =>
                                b.id === bubbleId ? { ...b, pinned: true } : b
                            ),
                        });
                    }
                },
            },
            { kind: 'separator' },
            {
                kind: 'action',
                id: 'delete',
                label: '버블 삭제',
                danger: true,
                onSelect: () => this.setState({ bubbles: this.getState().bubbles.filter(b => b.id !== bubbleId) }),
            },
        ];
    }
}
