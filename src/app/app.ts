import { BackgroundLayer, Canvas, Palette, MenuBar, SettingsPanel, ShortcutHelp } from '@/components/index';
import ConfirmDialog from '@/components/global/ui/ConfirmDialog';
import CanvasAddButton from '@/components/canvas/CanvasAddButton';
import type { State } from '@/types/state';
import type { Preset, PresetColor } from '@/types/palette';
import type { Settings } from '@/types/settings';
import initialState from '@/data/state';
import BubbleContextMenu from '../components/ContextMenu/BubbleContextMenu';
import SelectionContextMenu from '../components/ContextMenu/SelectionContextMenu';
import { loadPaletteStore, savePaletteStore, createPreset } from '@/lib/paletteStorage';
import { createPresetColor, mixColors } from '@/lib/color';
import { updatePreset, updatePresetColors, moveColors } from '@/lib/presetOps';
import { toggleId, mergeIds } from '@/lib/selection';
import type { HslColor } from '@/types/bubble';
import { radiusFromSize } from '@/data/constants';

/** 우클릭 좌표를 ContextMenu의 anchor DOMRect로 변환 (1x1 박스) */
function pointRect(p: { x: number; y: number }): DOMRect {
    return new DOMRect(p.x, p.y, 1, 1);
}

export default class App {
    private state: State;
    private backgroundLayer: BackgroundLayer;
    private canvas: Canvas;
    private bubbleContextMenu: BubbleContextMenu;
    private selectionContextMenu: SelectionContextMenu;
    private palette: Palette;
    private menuBar: MenuBar;
    private settingsPanel: SettingsPanel;
    private shortcutHelp: ShortcutHelp;
    private canvasAddButton: CanvasAddButton;
    private colorDeleteConfirm: ConfirmDialog;
    private presetDeleteConfirm: ConfirmDialog;

    constructor({ $app }: { $app: HTMLElement }) {
        const savedPalette = loadPaletteStore();

        const presets = savedPalette.presets.length > 0
            ? savedPalette.presets
            : [createPreset('프리셋 1')];
        const activePresetId = savedPalette.activePresetId ?? presets[0].id;

        this.state = {
            ...initialState,
            palette: {
                ...initialState.palette,
                presets,
                activePresetId,
            },
        };

        this.backgroundLayer = new BackgroundLayer({ $target: $app });

        this.bubbleContextMenu = new BubbleContextMenu({
            onFreeze:   (id) => this.canvas.freezeBubble(id),
            onUnfreeze: (id) => this.canvas.unfreezeBubble(id),
            onPin:      (id) => this.canvas.pinBubble(id),
            onUnpin:    (id) => this.canvas.unpinBubble(id),
            getState:   () => this.state,
            setState:   (next) => this.setState(next),
            onSaveToPreset: (bubbleId) => this.saveToActivePreset(bubbleId),
            onDuplicate: (bubbleId) => this.canvas.duplicateBubble(bubbleId),
            onEditColor: (bubbleId) => {
                const bubble = this.state.bubbles.find(b => b.id === bubbleId);
                if (!bubble) return;
                this.palette.openColorPicker((color) => {
                    this.setState({
                        bubbles: this.state.bubbles.map(b =>
                            b.id === bubbleId ? { ...b, color } : b
                        ),
                    });
                }, bubble.color);
            },
        });

        this.selectionContextMenu = new SelectionContextMenu({
            getState: () => this.state,
            setState: (next) => this.setState(next),
            onMix:    (point) => this.mixSelected(point),
            onDelete: () => this.deleteSelected(),
            onSaveToPreset: () => this.saveSelectedToActivePreset(),
            onPinToggle: (shouldPin) => this.pinSelected(shouldPin),
        });

        this.canvas = new Canvas({
            $target: $app,
            initState: this.state,
            onBubbleCatch: (bubble) => {
                this.setState({ bubbles: [...this.state.bubbles, bubble] });
            },
            onBubbleClick: (id, additive) => this.toggleBubbleSelection(id, additive),
            onBubbleContextMenu: (id, bubbleRect, point) => this.openBubbleContextMenu(id, bubbleRect, point),
            onMarqueeEnd: (ids, additive) => this.applyMarqueeSelection(ids, additive),
            onEmptyClick: () => this.setState({ selectedBubbleIds: [] }),
            onEmptyContextMenu: (point) => this.openEmptyContextMenu(point),
            // 버블을 팔레트 위로 드래그할 때 드롭 존을 표시하고, 드롭 시 색상을 저장한다.
            onBubbleDragStart: () => this.palette.setDropZoneVisible(true),
            onBubbleDragEnd: (id, x, y) => this.handleBubbleDragEnd(id, x, y),
        });

        this.palette = new Palette({
            $target: $app,
            onAddPreset: () => this.addPreset(),
            onSelectPreset: (presetId) => this.setState({
                palette: { ...this.state.palette, activePresetId: presetId },
                selectedColorIds: [],  // 프리셋 전환 시 선택 해제 (색 id는 프리셋별이라 의미가 사라짐)
            }),
            onRenamePreset: (presetId, name) => this.setState({
                palette: {
                    ...this.state.palette,
                    presets: updatePreset(this.state.palette.presets, presetId, p => ({ ...p, name })),
                },
            }),
            onDeletePreset: (presetId) => this.deletePreset(presetId),
            onDuplicatePreset: (presetId) => this.duplicatePreset(presetId),
            onReorderPresets: (orderedIds) => this.reorderPresets(orderedIds),
            onColorSlotSelect: (colorId, additive) => this.toggleColorSelection(colorId, additive),
            onColorSlotActivate: (presetColor) => this.canvas.spawnBubble(presetColor.color),
            onMarqueeSelect: (ids, additive) => this.applyColorMarquee(ids, additive),
            onEmptySelectionClick: () => this.setState({ selectedColorIds: [] }),
            onAddColorToPreset: (color) => this.addColorToActivePreset(color),
            getPresets: () => this.state.palette.presets,
            getActivePresetId: () => this.state.palette.activePresetId,
            getSelectedColorIds: () => this.state.selectedColorIds,
            onEditPresetColor: (presetId, colorId, newColor) => this.editPresetColor(presetId, colorId, newColor),
            onDeletePresetColor: (presetId, colorId) => this.deletePresetColor(presetId, colorId),
            onDuplicatePresetColor: (presetId, colorId) => this.duplicatePresetColor(presetId, colorId),
            onMoveColorToPreset: (fromPresetId, colorId, toPresetId) => this.moveColorToPreset(fromPresetId, colorId, toPresetId),
            onReorderPresetColors: (presetId, newColorIds) => this.reorderPresetColors(presetId, newColorIds),
            onMoveColorsToPreset: (fromPresetId, colorIds, toPresetId) => this.moveColorsToPreset(fromPresetId, colorIds, toPresetId),
            onDropColorsToCanvas: (presetId, colorIds, x, y) => this.dropColorsToCanvas(presetId, colorIds, x, y),
            onAddSelectedColorsToCanvas: () => this.addSelectedColorsToCanvas(),
            onMoveSelectedColorsToPreset: (toPresetId) => this.moveSelectedColorsToPreset(toPresetId),
            onDeleteSelectedColors: () => this.deleteSelectedColors(),
            onPickerNotationChange: (notation) => this.setState({
                settings: { ...this.state.settings, pickerNotation: notation },
            }),
        });

        this.settingsPanel = new SettingsPanel({
            $target: $app,
            initSettings: this.state.settings,
            onChange: (settings: Settings) => this.setState({ settings }),
            onOpenChange: (open) => this.menuBar?.setSettingsActive(open),
        });

        this.shortcutHelp = new ShortcutHelp({ $target: $app });

        this.menuBar = new MenuBar({
            $target: $app,
            onRainToggle: () => this.setState({ rainMode: !this.state.rainMode }),
            onPaletteToggle: () => this.setState({
                palette: { ...this.state.palette, open: !this.state.palette.open },
            }),
            onDarkModeToggle: () => this.setState({
                settings: { ...this.state.settings, darkMode: !this.state.settings.darkMode },
            }),
            onSettingsToggle: (anchorRect) => this.settingsPanel.toggle(anchorRect),
            onHelpToggle: () => this.shortcutHelp.toggle(),
            getOccupiedRightWidth: () => this.palette.getOccupiedWidth(),
        });

        this.canvasAddButton = new CanvasAddButton({
            $target: $app,
            onClick: () => this.palette.openColorPicker((color) => this.canvas.spawnBubble(color)),
        });

        this.colorDeleteConfirm = new ConfirmDialog({
            title: '색상 삭제',
            storageKey: 'colordrip:skipConfirmDeleteColors',
        });
        this.presetDeleteConfirm = new ConfirmDialog({
            title: '프리셋 삭제',
            storageKey: 'colordrip:skipConfirmDeletePreset',
        });

        this.bindShortcuts();

        this.setState(this.state);
    }

    /** 전역 키보드 단축키. 모든 액션은 기존 메서드/콜백으로 위임한다. */
    private bindShortcuts() {
        document.addEventListener('keydown', (e) => {
            // 입력 필드(프리셋 이름 편집 등) 포커스 중에는 네이티브 동작에 양보한다.
            const target = e.target as HTMLElement | null;
            if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
                return;
            }

            const mod = e.metaKey || e.ctrlKey;

            // Escape: 도움말 닫기 → 선택 해제. ContextMenu가 열려 있으면 메뉴 자체 Escape에 양보.
            if (e.key === 'Escape') {
                if (this.shortcutHelp.isOpen()) { this.shortcutHelp.close(); return; }
                if (this.state.contextMenu.open) return;
                if (this.state.selectedBubbleIds.length > 0) this.setState({ selectedBubbleIds: [] });
                if (this.state.selectedColorIds.length > 0) this.setState({ selectedColorIds: [] });
                return;
            }

            // 도움말 토글은 오버레이/메뉴 위에서도 동작하도록 가드보다 먼저 처리.
            if (e.key === '?') { e.preventDefault(); this.shortcutHelp.toggle(); return; }

            // 컨텍스트 메뉴/도움말이 열려 있으면 액션 단축키는 무시한다.
            if (this.state.contextMenu.open || this.shortcutHelp.isOpen() || this.colorDeleteConfirm.isOpen || this.presetDeleteConfirm.isOpen) return;

            // ── 수식어(Cmd/Ctrl) 조합 ──
            if (mod) {
                switch (e.key.toLowerCase()) {
                    case 'a': e.preventDefault(); this.state.palette.open ? this.selectAllColors() : this.selectAllBubbles(); return;
                    case 'd': e.preventDefault(); this.duplicateSelected(); return;
                    case 's': e.preventDefault(); this.saveSelectedToActivePreset(); return;
                    case ',': e.preventDefault(); this.menuBar.toggleSettings(); return;
                }
                return; // 그 외 수식어 조합은 브라우저에 양보
            }

            // ── 단일 키 ──
            switch (e.key) {
                // 전역 토글
                case 'r': case 'R':
                    this.setState({ rainMode: !this.state.rainMode });
                    return;
                case 'p': case 'P':
                    this.setState({ palette: { ...this.state.palette, open: !this.state.palette.open } });
                    return;
                case 'd': case 'D':
                    this.setState({ settings: { ...this.state.settings, darkMode: !this.state.settings.darkMode } });
                    return;

                // 생성 / 프리셋
                case 'n':
                    this.palette.openColorPicker((color) => this.canvas.spawnBubble(color));
                    return;
                case 'N': // Shift+N
                    this.addPreset();
                    return;
                case '[': this.cyclePreset(-1); return;
                case ']': this.cyclePreset(1); return;

                // 선택 대상 액션
                case 'm': case 'M':
                    this.mixSelected({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
                    return;
                case 'f': case 'F': {
                    const ids = this.state.selectedBubbleIds;
                    if (ids.length === 0) return;
                    const idSet = new Set(ids);
                    const allPinned = this.state.bubbles.filter(b => idSet.has(b.id)).every(b => b.pinned);
                    this.pinSelected(!allPinned);
                    return;
                }
                case 'Delete':
                case 'Backspace':
                    if (this.state.selectedColorIds.length > 0) {
                        e.preventDefault();
                        const count = this.state.selectedColorIds.length;
                        this.colorDeleteConfirm.open(
                            `선택한 색상 ${count}개를 삭제할까요?`,
                            () => this.deleteSelectedColors(),
                        );
                    } else if (this.state.selectedBubbleIds.length > 0) { e.preventDefault(); this.deleteSelected(); }
                    return;
                case 'Enter':
                    if (this.state.selectedColorIds.length > 0) this.addSelectedColorsToCanvas();
                    return;
            }
        });
    }

    setState(nextState: Partial<State>) {
        const prevPalette = this.state.palette;
        const prevBubbleSize = this.state.settings.bubble.size;
        this.state = { ...this.state, ...nextState };

        // bubble.size 변경 시 state.bubbles 반지름 동기화 (duplicateBubble 등이 올바른 반지름을 참조하도록)
        if (this.state.settings.bubble.size !== prevBubbleSize) {
            const newRadius = radiusFromSize(this.state.settings.bubble.size);
            this.state = {
                ...this.state,
                bubbles: this.state.bubbles.map(b => ({ ...b, radius: newRadius })),
            };
        }
        document.body.classList.toggle('dark', this.state.settings.darkMode);
        this.backgroundLayer.setState(this.state);
        this.canvas.setState(this.state);

        // palette.setState가 menuBar.setState보다 먼저 실행되어야 한다.
        // menuBar가 점유 너비를 측정할 때 PaletteSidebar의 translate 클래스가 이미 갱신된 상태여야 정확한 값이 나온다.
        // palette는 colorNotation 같은 설정도 보유하므로 매 setState마다 호출하고,
        // 저장(side effect)만 palette 상태가 실제로 바뀌었을 때만 수행한다.
        this.palette.setState(this.state);
        if (this.state.palette !== prevPalette) {
            savePaletteStore({
                presets: this.state.palette.presets,
                activePresetId: this.state.palette.activePresetId,
            });
        }

        this.canvasAddButton.setRightOffset(this.palette.getOccupiedWidth());
        this.menuBar.setState(this.state);
        this.settingsPanel.setState(this.state.settings);
    }

    private addPreset() {
        const existing = this.state.palette.presets.length;
        const preset = createPreset(`프리셋 ${existing + 1}`);
        this.setState({
            palette: {
                ...this.state.palette,
                presets: [...this.state.palette.presets, preset],
                activePresetId: preset.id,
            },
        });
    }

    private duplicatePreset(presetId: string) {
        const preset = this.state.palette.presets.find(p => p.id === presetId);
        if (!preset) return;

        const newPreset: Preset = {
            ...createPreset(`${preset.name} 복사`),
            colors: preset.colors.map(c => ({ ...c, id: crypto.randomUUID() })),
        };

        const idx = this.state.palette.presets.findIndex(p => p.id === presetId);
        const presets = [...this.state.palette.presets];
        presets.splice(idx + 1, 0, newPreset);

        this.setState({
            palette: { ...this.state.palette, presets, activePresetId: newPreset.id },
        });
    }

    private reorderPresets(orderedIds: string[]) {
        const presets = orderedIds
            .map(id => this.state.palette.presets.find(p => p.id === id))
            .filter((p): p is Preset => p !== undefined);
        this.setState({ palette: { ...this.state.palette, presets } });
    }

    private deletePreset(presetId: string) {
        const preset = this.state.palette.presets.find(p => p.id === presetId);
        const name = preset?.name ?? '프리셋';
        this.presetDeleteConfirm.open(
            `'${name}'을(를) 삭제할까요?`,
            () => {
                let presets = this.state.palette.presets.filter(p => p.id !== presetId);
                if (presets.length === 0) presets = [createPreset('프리셋 1')];
                const activePresetId = this.state.palette.activePresetId === presetId
                    ? presets[0].id
                    : this.state.palette.activePresetId;
                this.setState({ palette: { ...this.state.palette, presets, activePresetId } });
            },
        );
    }

    private saveToActivePreset(bubbleId: number) {
        const bubble = this.state.bubbles.find(b => b.id === bubbleId);
        if (!bubble) return;
        this.addColorToActivePreset(bubble.color);
    }

    private reorderPresetColors(presetId: string, newColorIds: string[]) {
        this.setState({
            palette: {
                ...this.state.palette,
                presets: updatePresetColors(this.state.palette.presets, presetId, colors => {
                    const colorMap = new Map(colors.map(c => [c.id, c]));
                    return newColorIds
                        .map(id => colorMap.get(id))
                        .filter((c): c is PresetColor => c !== undefined);
                }),
            },
        });
    }

    private editPresetColor(presetId: string, colorId: string, newColor: HslColor) {
        this.setState({
            palette: {
                ...this.state.palette,
                presets: updatePresetColors(this.state.palette.presets, presetId, colors =>
                    colors.map(c => c.id === colorId ? { ...c, color: newColor } : c)
                ),
            },
        });
    }

    private deletePresetColor(presetId: string, colorId: string) {
        this.setState({
            palette: {
                ...this.state.palette,
                presets: updatePresetColors(this.state.palette.presets, presetId, colors =>
                    colors.filter(c => c.id !== colorId)
                ),
            },
        });
    }

    private duplicatePresetColor(presetId: string, colorId: string) {
        this.setState({
            palette: {
                ...this.state.palette,
                presets: updatePresetColors(this.state.palette.presets, presetId, colors => {
                    const idx = colors.findIndex(c => c.id === colorId);
                    if (idx < 0) return colors;
                    const copy = { ...colors[idx], id: crypto.randomUUID() };
                    const next = [...colors];
                    next.splice(idx + 1, 0, copy);
                    return next;
                }),
            },
        });
    }

    private moveColorToPreset(fromPresetId: string, colorId: string, toPresetId: string) {
        const presets = moveColors(this.state.palette.presets, fromPresetId, toPresetId, [colorId]);
        this.setState({ palette: { ...this.state.palette, presets } });
    }

    // ── 팔레트 색상 다중 선택 (캔버스 버블 선택 로직 미러링) ──

    private toggleColorSelection(id: string, additive: boolean) {
        const next = additive ? toggleId(this.state.selectedColorIds, id) : [id];
        this.setState({ selectedColorIds: next, selectedBubbleIds: [] });
    }

    private applyColorMarquee(ids: string[], additive: boolean) {
        const next = additive ? mergeIds(this.state.selectedColorIds, ids) : ids;
        this.setState({ selectedColorIds: next, selectedBubbleIds: [] });
    }

    private selectedColorsInActivePreset(): PresetColor[] {
        const { activePresetId, presets } = this.state.palette;
        const preset = presets.find(p => p.id === activePresetId);
        if (!preset) return [];
        const idSet = new Set(this.state.selectedColorIds);
        return preset.colors.filter(c => idSet.has(c.id));
    }

    private addSelectedColorsToCanvas() {
        const colors = this.selectedColorsInActivePreset();
        if (colors.length === 0) return;
        colors.forEach(c => this.canvas.spawnBubble(c.color));
        this.setState({ selectedColorIds: [] });
    }

    private deleteSelectedColors() {
        const { activePresetId } = this.state.palette;
        if (!activePresetId) return;
        const idSet = new Set(this.state.selectedColorIds);
        if (idSet.size === 0) return;
        this.setState({
            palette: {
                ...this.state.palette,
                presets: updatePresetColors(this.state.palette.presets, activePresetId, colors =>
                    colors.filter(c => !idSet.has(c.id))
                ),
            },
            selectedColorIds: [],
        });
    }

    private moveSelectedColorsToPreset(toPresetId: string) {
        const { activePresetId } = this.state.palette;
        if (!activePresetId) return;
        this.moveColorsToPreset(activePresetId, this.state.selectedColorIds, toPresetId);
    }

    // 그룹 드래그/일괄 메뉴 공용. colorIds를 fromPreset에서 빼서 toPreset 끝에 붙인다.
    private moveColorsToPreset(fromPresetId: string, colorIds: string[], toPresetId: string) {
        if (fromPresetId === toPresetId || colorIds.length === 0) return;
        const presets = moveColors(this.state.palette.presets, fromPresetId, toPresetId, colorIds);
        this.setState({ palette: { ...this.state.palette, presets }, selectedColorIds: [] });
    }

    // 버블을 팔레트 위에 드롭: 색상을 활성 프리셋에 저장하고 버블을 캔버스에서 제거한다.
    // 드래그한 버블이 다중 선택에 포함돼 있으면 선택 전체를 한 번에 저장/제거한다.
    private handleBubbleDragEnd(id: number, x: number, y: number) {
        this.palette.setDropZoneVisible(false);

        const paletteWidth = this.palette.getOccupiedWidth();
        const overPalette = paletteWidth > 0 && x >= window.innerWidth - paletteWidth;
        if (!overPalette) return;

        const selected = this.state.selectedBubbleIds;
        const ids = selected.length > 1 && selected.includes(id) ? new Set(selected) : new Set([id]);

        const targets = this.state.bubbles.filter(b => ids.has(b.id));
        if (targets.length === 0) return;

        targets.forEach(b => this.addColorToActivePreset(b.color));
        this.setState({
            bubbles: this.state.bubbles.filter(b => !ids.has(b.id)),
            selectedBubbleIds: [],
        });
    }

    // 그룹 드래그로 사이드바 밖에 드롭. 각 색을 드롭 좌표 주변에 살짝 흩어 스폰한다.
    private dropColorsToCanvas(presetId: string, colorIds: string[], x: number, y: number) {
        const preset = this.state.palette.presets.find(p => p.id === presetId);
        if (!preset) return;
        const idSet = new Set(colorIds);
        const colors = preset.colors.filter(c => idSet.has(c.id));
        if (colors.length === 0) return;
        const radius = radiusFromSize(this.state.settings.bubble.size);
        colors.forEach((c, i) => {
            const dx = i === 0 ? 0 : (Math.random() - 0.5) * radius * 4;
            const dy = i === 0 ? 0 : (Math.random() - 0.5) * radius * 4;
            this.canvas.spawnMixedBubble(c.color, radius, { x: x + dx, y: y + dy });
        });
        this.setState({ selectedColorIds: [] });
    }

    private applyMarqueeSelection(ids: number[], additive: boolean) {
        const next = additive ? mergeIds(this.state.selectedBubbleIds, ids) : ids;
        this.setState({ selectedBubbleIds: next, selectedColorIds: [] });
    }

    private toggleBubbleSelection(id: number, additive: boolean) {
        const next = additive ? toggleId(this.state.selectedBubbleIds, id) : [id];
        this.setState({ selectedBubbleIds: next, selectedColorIds: [] });
    }

    private openBubbleContextMenu(id: number, bubbleRect: DOMRect, point: { x: number; y: number }) {
        // 선택된 버블이 있으면 어디서 우클릭하든 SelectionContextMenu (anchor는 우클릭 지점)
        if (this.state.selectedBubbleIds.length > 0) {
            this.selectionContextMenu.open(pointRect(point), point);
        } else {
            this.bubbleContextMenu.open(id, bubbleRect);
        }
    }

    private openEmptyContextMenu(point: { x: number; y: number }) {
        if (this.state.selectedBubbleIds.length === 0) return;
        this.selectionContextMenu.open(pointRect(point), point);
    }

    private mixSelected(point: { x: number; y: number }) {
        const idSet = new Set(this.state.selectedBubbleIds);
        const selected = this.state.bubbles.filter(b => idSet.has(b.id));
        if (selected.length < 2) return;

        const entries = selected.map(b => ({ color: b.color }));
        const mixed = mixColors(entries, this.state.settings.colorMixing);
        const avgRadius = selected.reduce((acc, b) => acc + b.radius, 0) / selected.length;

        this.canvas.spawnMixedBubble(mixed, avgRadius, point);
        this.setState({ selectedBubbleIds: [] });
    }

    private pinSelected(shouldPin: boolean) {
        const ids = this.state.selectedBubbleIds;
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        ids.forEach(id => shouldPin ? this.canvas.pinBubble(id) : this.canvas.unpinBubble(id));
        this.setState({
            bubbles: this.state.bubbles.map(b =>
                idSet.has(b.id) ? { ...b, pinned: shouldPin } : b
            ),
        });
    }

    private deleteSelected() {
        const selected = new Set(this.state.selectedBubbleIds);
        if (selected.size === 0) return;
        this.setState({
            bubbles: this.state.bubbles.filter(b => !selected.has(b.id)),
            selectedBubbleIds: [],
        });
    }

    private selectAllColors() {
        const { activePresetId, presets } = this.state.palette;
        const preset = presets.find(p => p.id === activePresetId);
        if (!preset || preset.colors.length === 0) return;
        this.setState({ selectedColorIds: preset.colors.map(c => c.id), selectedBubbleIds: [] });
    }

    private selectAllBubbles() {
        if (this.state.bubbles.length === 0) return;
        this.setState({
            selectedBubbleIds: this.state.bubbles.map(b => b.id),
            selectedColorIds: [],
        });
    }

    private duplicateSelected() {
        // canvas.duplicateBubble은 호출마다 state.bubbles를 갱신하지 않고 onBubbleCatch로 추가만 한다.
        // 현재 선택 스냅샷을 먼저 떠두고 순회한다.
        const ids = [...this.state.selectedBubbleIds];
        ids.forEach(id => this.canvas.duplicateBubble(id));
    }

    private cyclePreset(dir: -1 | 1) {
        const { presets, activePresetId } = this.state.palette;
        if (presets.length === 0) return;
        const idx = presets.findIndex(p => p.id === activePresetId);
        const nextIdx = (idx + dir + presets.length) % presets.length;
        this.setState({
            palette: { ...this.state.palette, activePresetId: presets[nextIdx].id },
            selectedColorIds: [],
        });
    }

    private saveSelectedToActivePreset() {
        const { activePresetId, presets } = this.state.palette;
        if (!activePresetId) return;
        const idSet = new Set(this.state.selectedBubbleIds);
        if (idSet.size === 0) return;

        const newColors = this.state.bubbles
            .filter(b => idSet.has(b.id))
            .map(b => createPresetColor(b.color));

        this.setState({
            palette: {
                ...this.state.palette,
                presets: updatePresetColors(presets, activePresetId, colors => [...colors, ...newColors]),
            },
        });
    }

    private addColorToActivePreset(color: HslColor) {
        const { activePresetId, presets } = this.state.palette;
        if (!activePresetId) return;

        const presetColor = createPresetColor(color);
        this.setState({
            palette: {
                ...this.state.palette,
                presets: updatePresetColors(presets, activePresetId, colors => [...colors, presetColor]),
            },
        });
    }
}
