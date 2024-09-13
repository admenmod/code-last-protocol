import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';

import { Cargo } from './cargo';
import { dirToVec2 } from '@/utils/cell';
import { CELL_SIZE } from '@/config';
import type { IScanData, World } from '@/scenes/World';
import { Entity } from './Entity';
import { MoveModule } from './modules/MoveModule';
import { ScanModule } from './modules/ScanModule';

type Iter = Generator<[string, ...any[]], any, any>;


const TIME = 1000;

export const ENV_UNIT = (_world: World, unit: Unit) => ({
	*turn(dir: number): Iter { yield ['move', 'turn', dir]; },
	*scan(): Iter { return yield ['scan', 'scan']; },
	*moveForward(c: number): Iter {
		for(let i = 0; i < c; i++) {
			const code = yield ['move', 'moveForward'];
			if(typeof code === 'symbol') return code;
		}
	},
	*moveTo(target?: Vector2, steps: number = Math.INF): Iter {
		if(!target) throw new Error('"moveTo" invalid argumnets '+String(target));
		if(unit.cell.isSame(target)) return false;

		for(let i = 0; i < steps; i++) {
			if(yield ['move', 'moveTo', target.new()]) continue;
			return false;
		}
	},
	*extract(): Iter { return yield ['work', 'extract']; },
	*transfer(target?: Vector2): Iter {
		if(!target) throw new Error('"transfer" invalid argumnets '+String(target));
		return yield ['cargo', 'transfer', target.new()];
	},
	get cargo_filled() { return unit.cargo.fullness_normaloze > 0.9; },
	get diration() { return unit.diration; },
	getForwardCell(unit?: Unit, data?: IScanData) {
		if(typeof unit === 'undefined' || typeof data === 'undefined') throw new Error('"getForwardCell" invalid argumnets');

		return data.find(it => it.pos.isSame(dirToVec2(unit.diration).add(unit.cell)));
	}
});

export const API_UNIT = {
	// extract: (world: World, unit: Unit) => {
	// 	// if(!unit.processes_state.work(true)) return { time: null, data: CODE.ERR_STATUS };
	// 	return { time: TIME, state: ['work'], data: world.unitExtract(unit, Vector2.ZERO) };
	// },
	// transfer: (world: World, unit: Unit, target: Vector2) => {
	// 	// if(!unit.processes_state.work(true)) return { time: null, data: CODE.ERR_STATUS };
	// 	return { time: TIME, state: ['work'], data: world.transfer(unit, target) };
	// }
};


export class Unit extends Entity {
	public readonly API = API_UNIT;

	public cargo = new Cargo(10);

	constructor(cell: Vector2, world: World) { super(cell, world, [MoveModule, ScanModule]); }

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
