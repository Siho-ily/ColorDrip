import { BackgroundLayer, Canvas, Palette } from '@/components/index';
import type { State } from '@/types/state';
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

    constructor({ $app }: { $app: HTMLElement }) {
        const savedPalette = loadPaletteStore();

        this.state = {
            ...initialState,
            palette: {
                ...initialState.palette,
                presets: savedPalette.presets,
                activePresetId: savedPalette.activePresetId,
                open: true,
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
            onColorSlotClick: (presetColor) => this.canvas.spawnBubble(presetColor.color),
            onAddColorToPreset: (color) => this.addColorToActivePreset(color),
            onToggleOpen: () => this.setState({
                palette: { ...this.state.palette, open: !this.state.palette.open },
            }),
        });

        this.setState(this.state);
    }

    setState(nextState: Partial<State>) {
        this.state = { ...this.state, ...nextState };
        this.backgroundLayer.setState(this.state);
        this.canvas.setState(this.state);
        this.palette.setState(this.state);

        savePaletteStore({
            presets: this.state.palette.presets,
            activePresetId: this.state.palette.activePresetId,
        });
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

    private deletePreset(presetId: string) {
        const presets = this.state.palette.presets.filter(p => p.id !== presetId);
        const activePresetId = this.state.palette.activePresetId === presetId
            ? (presets[0]?.id ?? null)
            : this.state.palette.activePresetId;
        this.setState({ palette: { ...this.state.palette, presets, activePresetId } });
    }

    private saveToActivePreset(bubbleId: number) {
        const { activePresetId, presets } = this.state.palette;
        if (!activePresetId) return;

        const bubble = this.state.bubbles.find(b => b.id === bubbleId);
        if (!bubble) return;

        const presetColor = createPresetColor(bubble.color);
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
