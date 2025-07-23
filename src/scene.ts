import type { Viewport } from 'ver/Viewport';

import { Node } from 'lib/scenes/Node';
import { ProcessSystem } from 'lib/scenes/Node';
import { RenderSystem } from 'lib/scenes/CanvasItem';
import { ControllersSystem } from 'lib/scenes/Control';

import { AnimationManager } from '@/animations';
import { canvas, mainloop, touches, viewport } from '@/init';

import { MainScene } from '@/scenes/MainScene';
import { EventAsFunction, FunctionIsEvent } from 'ver/events';

export const process = new EventAsFunction<null, [dt: number]>(null);
export const render = new EventAsFunction<null, [viewport: Viewport]>(null);


export const init: FunctionIsEvent<null, [], () => Promise<void>> = new FunctionIsEvent(null, async () => {
	await init.await();

	mainloop.on('update', dt => {
		process(dt);
		render(viewport);
		canvas.render();
		touches.nullify(dt);
	}, 0);

	mainloop.start();
});
export const exit: FunctionIsEvent<null, [], () => Promise<void>> = new FunctionIsEvent(null, async () => {
	await exit.await();

	mainloop.stop();

	mainloop.off('update');
});

init.on(() => {
	canvas.on('resize', size => viewport.size.set(size), 1000)
	.call(canvas, canvas.size, canvas.pixelRatio);
});
exit.on(() => canvas.off('resize'));


export const processSystem = new ProcessSystem();
export const renderSystem = new RenderSystem();
export const controllersSystem = new ControllersSystem(touches, viewport);

process.on(dt => {
	controllersSystem.update(dt);
	processSystem.update(dt);
});

render.on(viewport => {
	renderSystem.update(viewport);
});


init.once(async () => {
	await Node.load();
	const root_node = new Node();
	await root_node.init();

	processSystem.addRoot(root_node);
	renderSystem.addRoot(root_node);
	controllersSystem.addRoot(root_node);

	await MainScene.load();
	const main_scene = new MainScene();
	await main_scene.init();

	root_node.addChild(main_scene);
});


export const anims = new AnimationManager();

process.on(dt => { for(const anim of anims.anims) anim.tick(dt); }, -1000);
