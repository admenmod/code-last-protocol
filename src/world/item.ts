import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';

import { Cargo } from './cargo';
import { Entity } from './Entity';
import type { World } from '@/scenes/World';


export class Item extends Entity {
	public cargo = new Cargo(10);

	constructor(cell: Vector2, world: World) { super(cell, world, []); }

	public draw({ ctx }: Viewport, pos: Vector2) {
		ctx.fillStyle = '#eeaa77';
		ctx.beginPath();
		ctx.arc(pos.x, pos.y, 2, 0, Math.TAU);
		ctx.closePath();
		ctx.fill();
	}
}
