import { BackgroundLayer, Canvas, Palette } from '@/components/index';
import type { State } from '@/types/state';
import initialState from '@/data/state';

export default class App {
    private state: State;
    private backgroundLayer: BackgroundLayer;
    private canvas: Canvas;
    private palette: Palette;

    constructor({ $app }: { $app: HTMLElement }) {
        this.state = { ...initialState };

        this.backgroundLayer = new BackgroundLayer({ $target: $app });
        
        this.canvas = new Canvas({
            $target: $app,
            initState: initialState,
            onBubbleCatch: (bubble) => {
                // catch된 bubble을 state에 추가 — 이후 BubbleLayer가 DOM으로 렌더링
                this.setState({ bubbles: [...this.state.bubbles, bubble] });
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
