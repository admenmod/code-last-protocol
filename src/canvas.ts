import { MainLoop } from 'ver/MainLoop';
import { Viewport } from 'ver/Viewport';
import { CanvasLayers } from 'ver/CanvasLayers';
import { TouchesController } from 'ver/TouchesController';


export const mainloop = new MainLoop();
export const canvas = new CanvasLayers().init(document.querySelector('#canvas')!);
export const viewport = new Viewport(canvas.create('main').canvas.getContext('2d')!);

const GUIElement = document.querySelector<HTMLDivElement>('#GUI')!;
export const touches = new TouchesController(GUIElement, e => e.target === GUIElement);
