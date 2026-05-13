import { BackgroundLayer, Canvas, Palette } from '@/components/index';
import type { State } from '@/types/state';
import initialState from '@/data/state';
import BubbleContextMenu from '../components/ContextMenu/BubbleContextMenu';

export default class App {
    private state: State;
    private backgroundLayer: BackgroundLayer;
    private canvas: Canvas;
    private bubbleContextMenu: BubbleContextMenu;
    private palette: Palette;

    constructor({ $app }: { $app: HTMLElement }) {
        this.state = { ...initialState };

        this.backgroundLayer = new BackgroundLayer({ $target: $app });

        this.bubbleContextMenu = new BubbleContextMenu({
            onFreeze:   (id) => this.canvas.freezeBubble(id),
            onUnfreeze: (id) => this.canvas.unfreezeBubble(id),
            getState:   () => this.state,
            setState:   (next) => this.setState(next),
        });

        this.canvas = new Canvas({
            $target: $app,
            initState: initialState,
            onBubbleCatch: (bubble) => {
                this.setState({ bubbles: [...this.state.bubbles, bubble] });
            },
            onBubbleContextMenu: (id, bubbleRect) => {
                this.bubbleContextMenu.open(id, bubbleRect);
            },
        });

        this.palette = new Palette({
            $target: $app,
            onBubbleCreate: (_color) => {
                // 팔레트 항목 클릭 → canvas에 bubble 생성
            },
        });

        this.setState(this.state);
    }

    setState(nextState: Partial<State>) {
        this.state = { ...this.state, ...nextState };
        this.backgroundLayer.setState(this.state);
        this.canvas.setState(this.state);
        this.palette.setState(this.state);
    }
}
