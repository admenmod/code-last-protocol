import { EventAsFunction } from 'ver/events';


export interface IBoundingRect {
	x: number, y: number, width: number, height: number,
	left: number, right: number, top: number, bottom: number
}
const virtualKeyboard = (navigator as any).virtualKeyboard;
export const virtualKeyboard_geometrychange = new EventAsFunction<null, [boundingRect: IBoundingRect]>(null);

if(virtualKeyboard) {
	virtualKeyboard.overlaysContent = true;
	virtualKeyboard.addEventListener('geometrychange', () => {
		virtualKeyboard_geometrychange(virtualKeyboard.boundingRect.toJSON());
	});
}


export const history_back = new EventAsFunction<null, []>(null);

if(history.state !== 'backspace-intercept') history.pushState('backspace-intercept', '', location.href);

let c = 0;
window.addEventListener('popstate', () => {
	if(c = (c+1) % 2) history_back();
	history.forward();
});


export const window_resize = new EventAsFunction<null, []>(null);
window.addEventListener('resize', () => window_resize());

export const before_unload = new EventAsFunction<null, []>(null);
window.addEventListener('beforeunload', () => before_unload());
