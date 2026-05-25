import { ContextMenu } from '@/components/index';
import PaletteToggleButton from '@/components/palette/ui/PaletteToggleButton';
import type { MenuItemDef } from '@/types/menu';
import type { State } from '@/types/state';

export default class PaletteContextMenu {
  private menu: ContextMenu;
  private button: PaletteToggleButton;
  private readonly onToggle: () => void;
  private readonly getState: () => State;

  constructor({
    $target,
    onToggle,
    getState,
  }: {
    $target: HTMLElement;
    onToggle: () => void;
    getState: () => State;
  }) {
    this.onToggle = onToggle;
    this.getState = getState;

    this.button = new PaletteToggleButton({
      $target,
      onToggle,
      onContextMenu: (rect) => this.open(rect),
    });

    this.menu = new ContextMenu({ onClose: () => {} });
  }

  open(rect: DOMRect) {
    this.menu.show(rect, this.buildMenuItems());
  }

  setState(state: State) {
    this.button.setState(state);
  }

  private buildMenuItems(): MenuItemDef[] {
    const { open } = this.getState().palette;
    return [
      {
        kind: 'action',
        id: 'toggle-palette',
        label: open ? '팔레트 닫기' : '팔레트 열기',
        onSelect: () => this.onToggle(),
      },
    ];
  }
}
