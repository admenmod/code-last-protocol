import { MainLoop } from 'ver/MainLoop';
import { Viewport } from 'ver/Viewport';
import { CanvasLayers } from 'ver/CanvasLayers';
import { TouchesController } from 'ver/TouchesController';


export const mainloop = new MainLoop();
export const canvas = new CanvasLayers().init(document.querySelector('#canvas')!);
export const viewport = new Viewport(canvas.create('main').canvas.getContext('2d')!);

const GUIElement = document.querySelector<HTMLDivElement>('#GUI')!;
export const touches = new TouchesController().init(GUIElement, e => {
	const arr = e.composedPath();
	for(let i = 0; i < arr.length; i++) {
		const it = arr[i];
		if(it instanceof HTMLElement && it.hasAttribute('gui')) return false;
	}
	return true;
});


const app = document.querySelector<HTMLDivElement>('#app')!;
window.ondblclick = () => app.requestFullscreen();

canvas.on('resize', () => {
	if(document.fullscreenElement === app) {
		document.querySelector<HTMLElement>(':root')!.style
		.setProperty('--vh', GUIElement.getBoundingClientRect().height/100 +'px');
	}
});
