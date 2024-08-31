import type { TDiration } from '@/utils/cell';
import { Vector2 } from 'ver/Vector2';
import { Viewport } from 'ver/Viewport';
import { Event, EventDispatcher } from 'ver/events';
import { math as Math } from 'ver/helpers';


export class Structure extends EventDispatcher {
	public _diration: TDiration = 0;
	public get diration() { return this._diration; }
	public set diration(v) { this._diration = Math.mod(v, 0, 8) as TDiration; }

	constructor(
		public title = '<title>',
		public cell: Vector2,
		public size: Vector2
	) {
		super();
	}

	public draw(viewport: Viewport, pos: Vector2) {}
}
