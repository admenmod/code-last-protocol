import { NAME } from './index';
import { exit, init } from './state';
import { canvas, viewport } from '@/canvas';


init.on(() => {
	canvas.on('resize', size => viewport.size.set(size), 1000, NAME)
	.call(canvas, canvas.size, canvas.pixelRatio);
});
exit.on(() => canvas.off('resize', NAME));
