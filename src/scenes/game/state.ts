import { EventAsFunction, FunctionIsEvent } from 'ver/events';
import type { Viewport } from 'ver/Viewport';

import { AudioContorller } from 'lib/AudioController';

import { atom } from 'nanostores';
import { canvas, mainloop, touches, viewport } from '@/canvas';
import { NAME } from './index';

import { $selected_scene_name, $start } from '@/state';
import { history_back } from '@/global-events';
import type { Structure } from './scenes/Structure';


export const $selected_structure = atom<Structure | null>(null);


export const process = new EventAsFunction<null, [dt: number]>(null);
export const render = new EventAsFunction<null, [viewport: Viewport]>(null);

export const audioContorller = new AudioContorller();


export const init: FunctionIsEvent<null, [], () => Promise<void>> = new FunctionIsEvent(null, async () => {
	await init.await();

	mainloop.on('update', dt => {
		process(dt);
		render(viewport);
		canvas.render();
		touches.nullify(dt);
	}, 0, NAME);

	mainloop.start();
});
export const exit: FunctionIsEvent<null, [], () => Promise<void>> = new FunctionIsEvent(null, async () => {
	await exit.await();

	mainloop.stop();

	mainloop.off('update', NAME);
});


init.on(() => {
	history_back.on(() => {
		if($selected_structure.get() === null && $selected_scene_name.get() === NAME) return void $start('menu');
		$selected_structure.set(null);
	});
});
