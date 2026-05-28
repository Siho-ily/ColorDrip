/**
 * 다중 선택된 버블들을 대상으로 하는 컨텍스트 메뉴.
 *
 * BubbleContextMenu(단일)와 달리 freeze 로직은 없다.
 * 항목: 팔레트에 저장 / 선택한 N개 혼합 / 삭제.
 * 1개 선택 상태에서는 "혼합"이 의미가 없으므로 disabled.
 */
import { ContextMenu } from '@/components/index';
import type { MenuItemDef } from '@/types/menu';
import type { State } from '@/types/state';

export default class SelectionContextMenu {
    private menu: ContextMenu;
    private readonly getState: () => State;
    private readonly setState: (next: Partial<State>) => void;
    private readonly onMix: (point: { x: number; y: number }) => void;
    private readonly onDelete: () => void;
    private readonly onSaveToPreset: () => void;

    constructor({
        getState,
        setState,
        onMix,
        onDelete,
        onSaveToPreset,
    }: {
        getState: () => State;
        setState: (next: Partial<State>) => void;
        onMix: (point: { x: number; y: number }) => void;
        onDelete: () => void;
        onSaveToPreset: () => void;
    }) {
        this.getState = getState;
        this.setState = setState;
        this.onMix = onMix;
        this.onDelete = onDelete;
        this.onSaveToPreset = onSaveToPreset;

        this.menu = new ContextMenu({
            onClose: () => {
                this.setState({ contextMenu: { open: false, mode: 'multi', bubbleId: null, x: 0, y: 0 } });
            },
        });
    }

    /** anchorRect: 메뉴 배치 기준. point: 혼합 결과 버블 스폰 좌표 (viewport). */
    open(anchorRect: DOMRect, point: { x: number; y: number }) {
        const count = this.getState().selectedBubbleIds.length;
        this.menu.show(anchorRect, this.buildMenuItems(count, point));
        this.setState({ contextMenu: { open: true, mode: 'multi', bubbleId: null, x: anchorRect.left, y: anchorRect.top } });
    }

    private buildMenuItems(count: number, point: { x: number; y: number }): MenuItemDef[] {
        return [
            { kind: 'action', id: 'save-palette', label: `팔레트에 저장 (${count})`, onSelect: () => this.onSaveToPreset() },
            { kind: 'action', id: 'mix',          label: `선택한 ${count}개 혼합`, disabled: count < 2, onSelect: () => this.onMix(point) },
            { kind: 'separator' },
            { kind: 'action', id: 'delete',       label: `버블 ${count}개 삭제`, danger: true, onSelect: () => this.onDelete() },
        ];
    }
}
