import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';

import { Cargo } from './cargo';
import { Entity } from './Entity';


export class Structure extends Entity {
	public cargo = new Cargo(100);

	constructor(cell: Vector2, size: Vector2, public title = '<title>') {
		super(cell);
		this.size.set(size);
	}

	public draw(viewport: Viewport, pos: Vector2) {
		viewport.ctx.fillStyle = '';
	}
}
