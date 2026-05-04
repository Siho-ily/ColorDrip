import { BackgroundLayer, Canvas } from "@/components/index.js";

export default function App({ $app }) {
    this.state = {};

    const backgroundLayer = new BackgroundLayer({ $target: $app });
    const canvas = new Canvas({ $target: $app });

    this.setState = (nextState) => {
        this.state = nextState;
        backgroundLayer.setState(this.state);
        canvas.setState(this.state);
    };

    this.setState({
        rainMode: false,
        blobs: [],
    });
}
