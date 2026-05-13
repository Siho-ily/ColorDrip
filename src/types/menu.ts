export type MenuItemDef =
    | { kind: 'action';  id: string; label: string; hint?: string; danger?: boolean; onSelect: () => void }
    | { kind: 'submenu'; id: string; label: string; items: MenuItemDef[] }
    | { kind: 'separator' }
