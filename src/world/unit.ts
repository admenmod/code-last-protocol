import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';

import { Cargo } from './cargo';
import { dirToVec2 } from '@/utils/cell';
import { CELL_SIZE } from '@/config';
import type { IScanData, World } from '@/scenes/World';
import { Entity } from './Entity';
import { createStateManager } from '@/utils/state-manager';
import { MoveModule } from './modules/MoveModule';

type Iter = Generator<[string, ...any[]], any, any>;


const TIME = 1000;

export const ENV_UNIT = (_world: World, unit: Unit) => ({
	*turn(dir: number): Iter { yield ['turn', dir]; },
	*scan(): Iter { return yield ['scan']; },
	*moveForward(c: number): Iter {
		for(let i = 0; i < c; i++) if(!(yield ['moveForward'])) return false;
		return true;
	},
	*moveTo(target?: Vector2, steps: number = Math.INF): Iter {
		if(!target) throw new Error('"moveTo" invalid argumnets '+String(target));
		if(unit.cell.isSame(target)) return false;

		for(let i = 0; i < steps; i++) {
			if(yield ['moveTo', target.new()]) continue;
			return false;
		}
	},
	*extract(): Iter { return yield ['extract']; },
	*transfer(target?: Vector2): Iter {
		if(!target) throw new Error('"transfer" invalid argumnets '+String(target));
		return yield ['transfer', target.new()];
	},
	get cargo_filled() { return unit.cargo.fullness_normaloze > 0.9; },
	get diration() { return unit.diration; },
	getForwardCell(unit?: Unit, data?: IScanData) {
		if(typeof unit === 'undefined' || typeof data === 'undefined') throw new Error('"getForwardCell" invalid argumnets');

		return data.find(it => it.pos.isSame(dirToVec2(unit.diration).add(unit.cell)));
	}
});

export const API_UNIT = {
	// scan: (world: World, unit: Unit) => {
	// 	return { time: TIME, state: ['scan'], data: world.unitRadarScan(unit) }
	// },
	moveTo: (world: World, unit: Unit, pos: Vector2) => {
		return { time: TIME, state: { move: MoveModule }, data: world.moveTo(unit, pos, 1) };
	},
	// moveForward: (world: World, unit: Unit) => {
	// 	// if(!unit.processes_state.move(true)) return { time: null, data: CODE.ERR_STATUS };
	// 	return { time: TIME, state: ['move'], data: world.moveForward(unit, 1) };
	// },
	// turn: (_world: World, unit: Unit, dir: any) => {
	// 	// if(!unit.processes_state.move(true)) return { time: null, data: CODE.ERR_STATUS };
	// 	return { time: TIME, state: ['move'], data: unit.diration += Math.sign(dir) };
	// },
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

	constructor(cell: Vector2) { super(cell, [MoveModule]); }

	public processes_state = createStateManager({
		move: false as boolean,
		fire: false as boolean,
		scan: false as boolean,
		work: false as boolean
	}, {
		move: () => true,
		fire: () => true,
		scan: ({ move }) => !move,
		work: ({ move, fire }) => !(move && fire)
	});

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
