import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';

import { modules, mod_env, EntityParams, mod_st } from '@/modules';
import { Module } from '@/modules/Module';
import { IScanData } from '@/game/types';
import { dirToVec2 } from '@/utils/cell';
import { I, world } from '@/game/world';
import type { APIResult } from '@/code/Executor';
import { CODE } from '@/code/code';
import { Entity } from '@/game/Entity';
import { number, object } from '@/utils/strc-types';
import { GST } from '@/st-types';
// import { c } from '@/animations';


const ID = 'move';
type ID = typeof ID;

type Iter = Generator<[ID, string, ...any[]], any, any>;

export declare namespace MoveModule {
	export interface IOwner extends Entity<[ID]> {}
}

type IOwner = MoveModule.IOwner;

const st_model = object({
	[ID]: {
		force: number.range({ min: 1 })
	}
});

// function* unitMoveAnim(unit: Unit, rpos: Vector2) {
// 	const fix = unit.cell.new();
// 	yield* c(c => unit.cell.set(fix.new().add(rpos.new().inc(c))), 200, 20);
// }
// function* unitScanAnim(unit: Unit) {
// 	yield* c(c => (unit.scaning_rad = c), 900, 20);
// }

const TIME = 1000;

const ENV = (module: MoveModule) => {
	function* turn(dir?: number): Iter {
		if(typeof dir !== 'number') throw new Error('"turn" invalid argumnets');
		yield [ID, 'turn', dir];
	}
	function* moveForward(c: number): Iter {
		for(let i = 0; i < c; i++) {
			const code = yield [ID, 'moveForward'];
			if(typeof code === 'symbol') return code;
		}
	}
	function *moveTo(target?: Vector2, steps: number = Math.INF): Iter {
		if(!target) throw new Error('"moveTo" invalid argumnets');
		if(module.owner.cell.isSame(target)) return false;

		for(let i = 0; i < steps; i++) {
			if(yield [ID, 'moveTo', target.new()]) continue;
			return false;
		}
	}

	return {
		turn, move: { to: moveTo, forward: moveForward },

		get direction() { return module.owner.direction as any as () => GST.direction; },

		getForwardCell(data?: IScanData) {
			if(typeof data === 'undefined') throw new Error('"getForwardCell" invalid argumnets');

			return data.find(it => it.pos.isSame(dirToVec2(module.owner.direction).add(module.owner.cell)));
		}
	}
};

const API = {
	turn: (module, dir: number) => ({ time: TIME, task: () => { module.owner.direction += Math.sign(dir); }}),
	moveTo: (module, pos: Vector2) => ({
		time: module.canMoveToPos(module.owner.cell.new().sub(pos), 0.1) ? TIME : 100,
		task: () => module.moveTo(pos, 1)
	}),
	moveForward: (module) => ({ time: TIME, task: () => module.moveForward(1) })
} satisfies Record<string, (module: MoveModule, ...args: any) => APIResult<any>>;


export class MoveModule extends Module<ID, IOwner> {
	public force: number;

	constructor(owner: IOwner, { move }: EntityParams<[ID]>) {
		super(ID, owner, API);

		this.force = move.force;
	}

	public canMoveToPos(rpos: Vector2, force: number) {
		if(rpos.isSame(Vector2.ZERO)) return CODE.TARGET_DISTANCE_ZERO;
		if(Math.abs(rpos.x) > 1 || Math.abs(rpos.y) > 1) return CODE.ERR_NOT_IN_RANGE;

		const target = this.owner.cell.new().add(rpos);
		const TCI = I(target); // Target cell index
		const UCI = I(this.owner.cell.new()); // Unit cell index

		if(Math.abs(world.height_map[UCI] - world.height_map[TCI]) > force) return CODE.ERR_BIG_DIFF_HEIGHT;

		return;
	}
	public move(rpos: Vector2) {
		const code = this.canMoveToPos(rpos, 0.1);

		if(typeof code !== 'symbol') this.owner.cell.add(rpos);
		// if(typeof code !== 'symbol') anims.run(unitMoveAnim, unit, rpos);

		return code;
	}
	public moveTo(pos: Vector2, speed: number) {
		return this.move(pos.new().sub(this.owner.cell).sign().inc(speed));
	}
	public moveForward(speed: number) {
		return this.move(dirToVec2(this.owner.direction).inc(speed));
	}
}


mod_env[ID] = ENV;
mod_st[ID] = st_model;
modules[ID] = MoveModule;

declare module '@/modules' {
	namespace mod_env { let move: typeof ENV; }
	namespace mod_st { let move: typeof st_model; }
	namespace modules { let move: typeof MoveModule; }
}
