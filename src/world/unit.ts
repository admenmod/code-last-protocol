import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';

import { TDiration, dirToVec2 } from '@/utils/cell';
import { CELL_SIZE } from '@/config';
import type { IScanData, World } from '@/scenes/World';
import { WorldObject } from './WorldObject';


type Iter = Generator<any, any, any>;

export const API = (world: World, unit: Unit) => ({
	*turn(dir: number): Iter { yield ['turn', null, dir]; },
	*scan(): Iter { return yield ['scan']; },
	*moveForward(c: number): Iter {
		for(let i = 0; i < c; i++) if(!(yield ['moveForward'])) return false;
		return true;
	},
	*moveTo(target?: Vector2, steps: number = Math.INF): Iter {
		if(!target) throw new Error('"moveTo" invalid argumnets '+String(target));
		if(unit.cell.isSame(target)) return false;

		for(let i = 0; i < steps; i++) {
			if(yield ['moveTo', null, target.new()]) continue;
			return false;
		}
	},
	*extract(): Iter { return yield ['extract']; },
	*transfer(target?: Vector2): Iter {
		if(!target) throw new Error('"transfer" invalid argumnets '+String(target));
		return yield ['transfer', null, target.new()];
	},
	get cargo_filled() { return world.resources_cargo.get(unit)!.fullness_normaloze > 0.9; },
	get diration() { return unit.diration; },
	getForwardCell(unit?: Unit, data?: IScanData) {
		if(typeof unit === 'undefined' || typeof data === 'undefined') throw new Error('"getForwardCell" invalid argumnets');

		return data.find(it => it.pos.isSame(dirToVec2(unit.diration).add(unit.cell)));
	}
});


export class Unit extends WorldObject {
	public _diration: TDiration = 0;
	public get diration() { return this._diration; }
	public set diration(v) { this._diration = Math.mod(v, 0, 8) as TDiration; }


	public copasity: number = 10;

	constructor(cell: Vector2) { super(cell); }

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
