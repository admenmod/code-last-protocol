import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import { System } from 'ver/System';
import type { Viewport } from 'ver/Viewport';
import type { Touch, TouchesController } from 'ver/TouchesController';

import { Node2D } from './Node2D.js';


export interface IInputEvent {
	pos: Vector2;
	local: Vector2;
	touch: Touch;
	viewport: Viewport;
}


export class ControllersSystem extends System<typeof Control> {
	public '@input:press' = new Event<ControllersSystem, [e: IInputEvent]>(this);
	public '@input:up'    = new Event<ControllersSystem, [e: IInputEvent]>(this);
	public '@input:move'  = new Event<ControllersSystem, [e: IInputEvent]>(this);

	public '@input:click'    = new Event<ControllersSystem, [e: IInputEvent]>(this);
	public '@input:dblclick' = new Event<ControllersSystem, [e: IInputEvent]>(this);


	protected _sort(a: Control, b: Control): number { return a.globalzIndex - b.globalzIndex; }
	constructor(public touches: TouchesController, public viewport: Viewport) {
		super(Control);

		const zIndex = () => this._items.sort(this._sort);

		this['@add'].on(item => {
			item.on('change%zIndex', zIndex);
			zIndex();
		});

		this['@removing'].on(item => item.off('change%zIndex', zIndex));


		const fn_touchstart = touches['@touchstart'].on(touch => {
			const tpos = viewport.transformFromScreenToViewport(touch.pos.new());
			const local = viewport.transformToLocal(touch.pos.new());

			this['@input:press'].emit({ pos: tpos, local, touch, viewport });

			for(const item of this._items) {
				const position = item.globalPosition;
				const pos = tpos.new().sub(position).rotate(-item.globalRotation).add(position);

				item.emit('input:press', { pos, local, touch, viewport });
			}
		});
		const fn_touchend = touches['@touchend'].on(touch => {
			const tpos = viewport.transformFromScreenToViewport(touch.pos.new());
			const local = viewport.transformToLocal(touch.pos.new());

			this['@input:up'].emit({ pos: tpos, local, touch, viewport });

			for(const item of this._items) {
				const position = item.globalPosition;
				const pos = tpos.new().sub(position).rotate(-item.globalRotation).add(position);

				item.emit('input:up', { pos, local, touch, viewport });
			}
		});
		const fn_touchmove = touches['@touchmove'].on(touch => {
			const tpos = viewport.transformFromScreenToViewport(touch.pos.new());
			const local = viewport.transformToLocal(touch.pos.new());

			this['@input:move'].emit({ pos: tpos, local, touch, viewport });

			for(const item of this._items) {
				const position = item.globalPosition;
				const pos = tpos.new().sub(position).rotate(-item.globalRotation).add(position);

				item.emit('input:move', { pos, local, touch, viewport });
			}
		});

		const fn_touchclick = touches['@touchclick'].on(touch => {
			const tpos = viewport.transformFromScreenToViewport(touch.pos.new());
			const local = viewport.transformToLocal(touch.pos.new());

			this['@input:click'].emit({ pos: tpos, local, touch, viewport });

			for(const item of this._items) {
				const position = item.globalPosition;
				const pos = tpos.new().sub(position).rotate(-item.globalRotation).add(position);

				item.emit('input:click', { pos, local, touch, viewport });
			}
		});
		const fn_touchdblclick = touches['@touchdblclick'].on(touch => {
			const tpos = viewport.transformFromScreenToViewport(touch.pos.new());
			const local = viewport.transformToLocal(touch.pos.new());

			this['@input:dblclick'].emit({ pos: tpos, local, touch, viewport });

			for(const item of this._items) {
				const position = item.globalPosition;
				const pos = tpos.new().sub(position).rotate(-item.globalRotation).add(position);

				item.emit('input:dblclick', { pos, local, touch, viewport });
			}
		});

		this['@destroyed'].on(() => {
			touches.off('touchstart', fn_touchstart);
			touches.off('touchend', fn_touchend);
			touches.off('touchmove', fn_touchmove);

			touches.off('touchclick', fn_touchclick);
			touches.off('touchdblclick', fn_touchdblclick);
		});
	}

	public update(dt: number) {
		for(let i = 0; i < this._items.length; i++) {
			this._items[i].input(this.touches, this.viewport, dt);
		}
	}
}


const PARENT_CACHE = Symbol('PARENT_CACHE');

export class Control extends Node2D {
	public '@input:press' = new Event<Control, [e: IInputEvent]>(this);
	public '@input:up'    = new Event<Control, [e: IInputEvent]>(this);
	public '@input:move'  = new Event<Control, [e: IInputEvent]>(this);

	public '@input:click'    = new Event<Control, [e: IInputEvent]>(this);
	public '@input:dblclick' = new Event<Control, [e: IInputEvent]>(this);


	protected [PARENT_CACHE]: Control[] = [];


	constructor() {
		super();

		const ontree = () => {
			this[PARENT_CACHE].length = 0;
			this[PARENT_CACHE].push(...this.getChainParentsOf(Control));
		};

		ontree();

		this['@tree_entered'].on(ontree);
		this['@tree_exiting'].on(ontree);
	}


	protected _input(touches: TouchesController, viewport: Viewport, dt: number): void {}

	public input(touches: TouchesController, viewport: Viewport, dt: number): void {
		this._input(touches, viewport, dt);
	}
}
