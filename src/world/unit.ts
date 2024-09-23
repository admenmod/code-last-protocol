import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';

import { Cargo } from './cargo';
import { CELL_SIZE } from '@/config';
import type { World } from '@/scenes/World';
import { Entity } from './Entity';
import { MoveModule } from './modules/MoveModule';
import { ScanModule } from './modules/ScanModule';
import { CargoModule } from './modules/CargoModule';
import { ExtractModule } from './modules/ExtractModule';


export class Unit extends Entity {
	public cargo = new Cargo(10);

	constructor(cell: Vector2, world: World) { super(cell, world, [MoveModule, ScanModule, CargoModule, ExtractModule]); }

	public draw({ ctx }: Viewport, pos: Vector2) {
		ctx.strokeStyle = '#eeaa77';
		ctx.beginPath();
		ctx.moveTo(pos.x + -CELL_SIZE/2, pos.y);
		ctx.lineTo(pos.x + CELL_SIZE/2, pos.y + -CELL_SIZE/3);
		ctx.lineTo(pos.x + CELL_SIZE/2, pos.y + CELL_SIZE/3);
		ctx.closePath();
		ctx.stroke();

		ctx.fillStyle = '#eeaa77';
		ctx.beginPath();
		ctx.moveTo(pos.x + -CELL_SIZE/2, pos.y);
		ctx.lineTo(pos.x + CELL_SIZE/2, pos.y + -CELL_SIZE/3);
		ctx.lineTo(pos.x + CELL_SIZE/2, pos.y + CELL_SIZE/3);
		ctx.closePath();
		ctx.fill();
	}
}
