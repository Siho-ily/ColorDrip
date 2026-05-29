import { BackgroundLayer, Canvas, Palette, MenuBar, SettingsPanel } from '@/components/index';
import CanvasAddButton from '@/components/canvas/CanvasAddButton';
import type { State } from '@/types/state';
import type { Preset } from '@/types/palette';
import type { Settings } from '@/types/settings';
import initialState from '@/data/state';
import BubbleContextMenu from '../components/ContextMenu/BubbleContextMenu';
import SelectionContextMenu from '../components/ContextMenu/SelectionContextMenu';
import { loadPaletteStore, savePaletteStore, createPreset } from '@/lib/paletteStorage';
import { createPresetColor, mixColors } from '@/lib/color';
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
    private canvasAddButton: CanvasAddButton;

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
            getState:   () => this.state,
            setState:   (next) => this.setState(next),
            onSaveToPreset: (bubbleId) => this.saveToActivePreset(bubbleId),
            onDuplicate: (bubbleId) => this.canvas.duplicateBubble(bubbleId),
        });

        this.selectionContextMenu = new SelectionContextMenu({
            getState: () => this.state,
            setState: (next) => this.setState(next),
            onMix:    (point) => this.mixSelected(point),
            onDelete: () => this.deleteSelected(),
            onSaveToPreset: () => this.saveSelectedToActivePreset(),
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
        });

        this.palette = new Palette({
            $target: $app,
            onAddPreset: () => this.addPreset(),
            onSelectPreset: (presetId) => this.setState({
                palette: { ...this.state.palette, activePresetId: presetId },
            }),
            onRenamePreset: (presetId, name) => this.setState({
                palette: {
                    ...this.state.palette,
                    presets: this.state.palette.presets.map(p =>
                        p.id === presetId ? { ...p, name } : p
                    ),
                },
            }),
            onDeletePreset: (presetId) => this.deletePreset(presetId),
            onDuplicatePreset: (presetId) => this.duplicatePreset(presetId),
            onReorderPresets: (orderedIds) => this.reorderPresets(orderedIds),
            onColorSlotClick: (presetColor) => this.canvas.spawnBubble(presetColor.color),
            onAddColorToPreset: (color) => this.addColorToActivePreset(color),
            getPresets: () => this.state.palette.presets,
            onEditPresetColor: (presetId, colorId, newColor) => this.editPresetColor(presetId, colorId, newColor),
            onDeletePresetColor: (presetId, colorId) => this.deletePresetColor(presetId, colorId),
            onDuplicatePresetColor: (presetId, colorId) => this.duplicatePresetColor(presetId, colorId),
            onMoveColorToPreset: (fromPresetId, colorId, toPresetId) => this.moveColorToPreset(fromPresetId, colorId, toPresetId),
            onReorderPresetColors: (presetId, newColorIds) => this.reorderPresetColors(presetId, newColorIds),
            onPickerNotationChange: (notation) => this.setState({
                settings: { ...this.state.settings, pickerNotation: notation },
            }),
            onDropColorToCanvas: (presetId, colorId, x, y) => {
                const preset = this.state.palette.presets.find(p => p.id === presetId);
                const presetColor = preset?.colors.find(c => c.id === colorId);
                if (!presetColor) return;
                const radius = radiusFromSize(this.state.settings.bubble.size);
                this.canvas.spawnMixedBubble(presetColor.color, radius, { x, y });
            },
        });

        this.settingsPanel = new SettingsPanel({
            $target: $app,
            initSettings: this.state.settings,
            onChange: (settings: Settings) => this.setState({ settings }),
            onOpenChange: (open) => this.menuBar?.setSettingsActive(open),
        });

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
            getOccupiedRightWidth: () => this.palette.getOccupiedWidth(),
        });

        this.canvasAddButton = new CanvasAddButton({
            $target: $app,
            onClick: () => this.palette.openColorPicker((color) => this.canvas.spawnBubble(color)),
        });

        // Escape로 선택 해제. ContextMenu가 열려 있으면 ContextMenu 자체 Escape에 양보.
        document.addEventListener('keydown', (e) => {
            if (e.key !== 'Escape') return;
            if (this.state.contextMenu.open) return;
            if (this.state.selectedBubbleIds.length > 0) {
                this.setState({ selectedBubbleIds: [] });
            }
        });

        this.setState(this.state);
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
        let presets = this.state.palette.presets.filter(p => p.id !== presetId);
        if (presets.length === 0) presets = [createPreset('프리셋 1')];
        const activePresetId = this.state.palette.activePresetId === presetId
            ? presets[0].id
            : this.state.palette.activePresetId;
        this.setState({ palette: { ...this.state.palette, presets, activePresetId } });
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
                presets: this.state.palette.presets.map(p => {
                    if (p.id !== presetId) return p;
                    const colorMap = new Map(p.colors.map(c => [c.id, c]));
                    return {
                        ...p,
                        colors: newColorIds
                            .map(id => colorMap.get(id))
                            .filter((c): c is import('@/types/palette').PresetColor => c !== undefined),
                    };
                }),
            },
        });
    }

    private editPresetColor(presetId: string, colorId: string, newColor: import('@/types/bubble').HslColor) {
        this.setState({
            palette: {
                ...this.state.palette,
                presets: this.state.palette.presets.map(p =>
                    p.id !== presetId ? p : {
                        ...p,
                        colors: p.colors.map(c => c.id !== colorId ? c : { ...c, color: newColor }),
                    }
                ),
            },
        });
    }

    private deletePresetColor(presetId: string, colorId: string) {
        this.setState({
            palette: {
                ...this.state.palette,
                presets: this.state.palette.presets.map(p =>
                    p.id !== presetId ? p : { ...p, colors: p.colors.filter(c => c.id !== colorId) }
                ),
            },
        });
    }

    private duplicatePresetColor(presetId: string, colorId: string) {
        this.setState({
            palette: {
                ...this.state.palette,
                presets: this.state.palette.presets.map(p => {
                    if (p.id !== presetId) return p;
                    const idx = p.colors.findIndex(c => c.id === colorId);
                    if (idx < 0) return p;
                    const copy = { ...p.colors[idx], id: crypto.randomUUID() };
                    const colors = [...p.colors];
                    colors.splice(idx + 1, 0, copy);
                    return { ...p, colors };
                }),
            },
        });
    }

    private moveColorToPreset(fromPresetId: string, colorId: string, toPresetId: string) {
        let moved: import('@/types/palette').PresetColor | undefined;
        const presets = this.state.palette.presets
            .map(p => {
                if (p.id !== fromPresetId) return p;
                moved = p.colors.find(c => c.id === colorId);
                return { ...p, colors: p.colors.filter(c => c.id !== colorId) };
            })
            .map(p => {
                if (p.id !== toPresetId || !moved) return p;
                return { ...p, colors: [...p.colors, moved] };
            });
        this.setState({ palette: { ...this.state.palette, presets } });
    }

    private applyMarqueeSelection(ids: number[], additive: boolean) {
        if (additive) {
            const merged = Array.from(new Set([...this.state.selectedBubbleIds, ...ids]));
            this.setState({ selectedBubbleIds: merged });
        } else {
            this.setState({ selectedBubbleIds: ids });
        }
    }

    private toggleBubbleSelection(id: number, additive: boolean) {
        if (additive) {
            const prev = this.state.selectedBubbleIds;
            const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
            this.setState({ selectedBubbleIds: next });
        } else {
            this.setState({ selectedBubbleIds: [id] });
        }
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

    private deleteSelected() {
        const selected = new Set(this.state.selectedBubbleIds);
        if (selected.size === 0) return;
        this.setState({
            bubbles: this.state.bubbles.filter(b => !selected.has(b.id)),
            selectedBubbleIds: [],
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
                presets: presets.map(p =>
                    p.id === activePresetId ? { ...p, colors: [...p.colors, ...newColors] } : p
                ),
            },
        });
    }

    private addColorToActivePreset(color: import('@/types/bubble').HslColor) {
        const { activePresetId, presets } = this.state.palette;
        if (!activePresetId) return;

        const presetColor = createPresetColor(color);
        this.setState({
            palette: {
                ...this.state.palette,
                presets: presets.map(p =>
                    p.id === activePresetId
                        ? { ...p, colors: [...p.colors, presetColor] }
                        : p
                ),
            },
        });
    }
}
