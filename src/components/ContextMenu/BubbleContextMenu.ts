import chroma from 'chroma-js';
import { ContextMenu } from '@/components/index';
import type { MenuItemDef } from '@/types/menu';
import type { State } from '@/types/state';

export default class BubbleContextMenu {
    private menu: ContextMenu;
    private readonly onFreeze: (id: number) => void;
    private readonly onUnfreeze: (id: number) => void;
    private readonly getState: () => State;
    private readonly setState: (next: Partial<State>) => void;

    constructor({
        onFreeze,
        onUnfreeze,
        getState,
        setState,
    }: {
        onFreeze: (id: number) => void;
        onUnfreeze: (id: number) => void;
        getState: () => State;
        setState: (next: Partial<State>) => void;
    }) {
        this.onFreeze = onFreeze;
        this.onUnfreeze = onUnfreeze;
        this.getState = getState;
        this.setState = setState;

        this.menu = new ContextMenu({
            onClose: () => {
                const { bubbleId } = this.getState().contextMenu;
                if (bubbleId !== null) this.onUnfreeze(bubbleId);
                this.setState({ contextMenu: { open: false, bubbleId: null, x: 0, y: 0 } });
            },
        });
    }

    open(id: number, bubbleRect: DOMRect) {
        const { bubbleId: prevId } = this.getState().contextMenu;
        if (prevId !== null) this.onUnfreeze(prevId);

        this.onFreeze(id);
        this.menu.show(bubbleRect, this.buildMenuItems(id));
        this.setState({ contextMenu: { open: true, bubbleId: id, x: bubbleRect.right, y: bubbleRect.top } });
    }

    private buildMenuItems(bubbleId: number): MenuItemDef[] {
        const bubble = this.getState().bubbles.find(b => b.id === bubbleId);
        if (!bubble) return [];

        const { h, s, l } = bubble.color;
        const color = chroma.hsl(h, s / 100, l / 100);

        const hex = color.hex();
        const [r, g, b] = color.rgb().map(Math.round);
        const [hh, ss, ll] = color.hsl();
        const [ol, oc, oh] = color.oklch();

        const rgbStr   = `rgb(${r}, ${g}, ${b})`;
        const hslStr   = `hsl(${Math.round(hh)} ${Math.round(ss * 100)}% ${Math.round(ll * 100)}%)`;
        const oklchStr = `oklch(${(ol * 100).toFixed(1)}% ${oc.toFixed(3)} ${(oh ?? 0).toFixed(1)})`;

        return [
            {
                kind: 'submenu',
                id: 'copy',
                label: '색상 복사',
                items: [
                    { kind: 'action', id: 'copy-hex',   label: 'HEX',   hint: hex,      onSelect: () => navigator.clipboard.writeText(hex) },
                    { kind: 'action', id: 'copy-rgb',   label: 'RGB',   hint: rgbStr,   onSelect: () => navigator.clipboard.writeText(rgbStr) },
                    { kind: 'action', id: 'copy-hsl',   label: 'HSL',   hint: hslStr,   onSelect: () => navigator.clipboard.writeText(hslStr) },
                    { kind: 'action', id: 'copy-oklch', label: 'oklch', hint: oklchStr, onSelect: () => navigator.clipboard.writeText(oklchStr) },
                ],
            },
            { kind: 'separator' },
            { kind: 'action', id: 'edit-color',   label: '색상 편집',    onSelect: () => { /* TODO: open picker */ } },
            { kind: 'action', id: 'save-palette', label: '팔레트에 저장', onSelect: () => { /* TODO: save to palette */ } },
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
