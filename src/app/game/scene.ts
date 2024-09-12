import { Node } from 'lib/scenes/Node';
import { ProcessSystem } from 'lib/scenes/Node';
import { RenderSystem } from 'lib/scenes/CanvasItem';
import { ControllersSystem } from 'lib/scenes/Control';

import { AnimationManager } from '@/animations';
import { canvas, touches, viewport } from '@/canvas';
import { $selected_structure, exit, init, process, render } from './state';

import { NAME } from './index';
import { MainScene } from '@/scenes/MainScene';
import { kii } from '@/keyboard';


init.on(() => {
	canvas.on('resize', size => viewport.size.set(size), 1000, NAME)
	.call(canvas, canvas.size, canvas.pixelRatio);
});
exit.on(() => canvas.off('resize', NAME));


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


controllersSystem.on('input:click', () => $selected_structure.set(null));

init.once(() => {
	kii.on('keyup:input', e => {
		if(e.key === 'Escape') return void $selected_structure.set(null);
	});
});
