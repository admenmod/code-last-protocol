import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';

import { WorldObject } from './WorldObject';
import type { TDiration } from '@/utils/cell';


export class Structure extends WorldObject {
	public _diration: TDiration = 0;
	public get diration() { return this._diration; }
	public set diration(v) { this._diration = Math.mod(v, 0, 8) as TDiration; }

	public copasity: number = 100;

	constructor(cell: Vector2, size: Vector2, public title = '<title>') {
		super(cell);
		this.size.set(size);
	}

	public draw(viewport: Viewport, pos: Vector2) {
		viewport.ctx.fillStyle = '';
	}
}
