import { BackgroundLayer, Canvas, Palette, MenuBar, SettingsPanel } from '@/components/index';
import type { State } from '@/types/state';
import type { Preset } from '@/types/palette';
import type { Settings } from '@/types/settings';
import initialState from '@/data/state';
import BubbleContextMenu from '../components/ContextMenu/BubbleContextMenu';
import { loadPaletteStore, savePaletteStore, createPreset } from '@/lib/paletteStorage';
import { createPresetColor } from '@/lib/color';

export default class App {
    private state: State;
    private backgroundLayer: BackgroundLayer;
    private canvas: Canvas;
    private bubbleContextMenu: BubbleContextMenu;
    private palette: Palette;
    private menuBar: MenuBar;
    private settingsPanel: SettingsPanel;

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
        });

        this.canvas = new Canvas({
            $target: $app,
            initState: this.state,
            onBubbleCatch: (bubble) => {
                this.setState({ bubbles: [...this.state.bubbles, bubble] });
            },
            onBubbleContextMenu: (id, bubbleRect) => {
                this.bubbleContextMenu.open(id, bubbleRect);
            },
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
        });

        this.settingsPanel = new SettingsPanel({
            $target: $app,
            initSettings: this.state.settings,
            onChange: (settings: Settings) => this.setState({ settings }),
            onOpenChange: (open) => this.menuBar.setSettingsActive(open),
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
        });

        this.setState(this.state);
    }

    setState(nextState: Partial<State>) {
        const prevPalette = this.state.palette;
        this.state = { ...this.state, ...nextState };
        document.body.classList.toggle('dark', this.state.settings.darkMode);
        this.backgroundLayer.setState(this.state);
        this.canvas.setState(this.state);
        this.menuBar.setState(this.state);
        this.settingsPanel.setState(this.state.settings);

        if (this.state.palette !== prevPalette) {
            this.palette.setState(this.state);
            savePaletteStore({
                presets: this.state.palette.presets,
                activePresetId: this.state.palette.activePresetId,
            });
        }
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
