import { BackgroundLayer, Canvas, Palette } from "@/components/index.js";
import state from "@/data/state.json";

export default function App({ $app }) {
    /* ===== 상태 ===== */
    this.state = state;

    this.setState = (nextState) => {
        this.state = { ...this.state, ...nextState };
        backgroundLayer.setState(this.state);
        canvas.setState(this.state);
        palette.setState(this.state);
    };

    /* ===== 레이어 ===== */
    // 배경 레이어
    const backgroundLayer = new BackgroundLayer({ $target: $app });

    // 캔버스 레이어
    const canvas = new Canvas({ $target: $app });


    // 팔레트 레이어
    const palette = new Palette({
        $target: $app,
        onBlobCreate: (color) => {
            // 팔레트 항목 클릭 → canvas에 blob 생성
        },
    });

    this.setState(this.state);
}
