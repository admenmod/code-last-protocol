import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';

import { Cargo } from './cargo';
import { Entity } from './Entity';
import { World } from '@/scenes/World';


export class Structure extends Entity {
	public cargo = new Cargo(100);

	constructor(world: World, cell: Vector2, size: Vector2, public title = '<title>') {
		super(cell, world, []);
		this.size.set(size);
	}

	public draw(viewport: Viewport, pos: Vector2) {
		viewport.ctx.fillStyle = '';
	}
}
