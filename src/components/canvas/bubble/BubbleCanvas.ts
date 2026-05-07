import Matter from 'matter-js';

const { Engine, Render, Runner, Composite, World, Events } = Matter;

export default class BubbleCanvas {
    private engine: Matter.Engine;
    private render: Matter.Render;
    private runner: Matter.Runner;

    constructor(
        { $target }: { $target: HTMLElement }
    ) {
        // create Matter Engine
        this.engine = Engine.create();

        // width, height
        let width = $target.clientWidth;
        let height = $target.clientHeight;

        // wireframes 끄고 배경 투명 — BackgroundLayer가 배경을 담당
        this.render = Render.create({
            element: $target,
            engine: this.engine,
            options: { width, height, wireframes: false, background: 'transparent' },
        });

        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);
    }
}