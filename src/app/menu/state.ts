import { atom } from 'nanostores';
import { EventAsFunction, FunctionIsEvent } from 'ver/events';
import type { Viewport } from 'ver/Viewport';

import { canvas, mainloop, touches, viewport } from '@/canvas';
import { NAME } from './index';


export const process = new EventAsFunction<null, [dt: number]>(null);
export const render = new EventAsFunction<null, [viewport: Viewport]>(null);


export const init: FunctionIsEvent<null, [], () => Promise<void>> = new FunctionIsEvent(null, async () => {
	await init.await();

	mainloop.on('update', dt => {
		process(dt);

		viewport.clear();
		viewport.ctx.save();
		viewport.use();
		render(viewport);
		viewport.ctx.restore();

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
