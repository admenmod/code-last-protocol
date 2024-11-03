import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';

import { modules } from '../modules';
import { Module } from '@/game/EModule';
import { IScanData } from '@/scenes/World';
import { dirToVec2, TDiration } from '@/utils/cell';
import { world } from '@/game/world';
import type { APIResult } from '@/code/Executor';
import { CODE } from '@/code/code';
import { I } from '@/scenes/WorldMap';
import { Entity } from '../Entity';
// import { c } from '@/animations';


const ID = 'move';
type ID = typeof ID;

type Iter = Generator<[ID, string, ...any[]], any, any>;

export declare namespace MoveModule {
	export interface IOwner extends Entity {}
}

type IOwner = MoveModule.IOwner;

// function* unitMoveAnim(unit: Unit, rpos: Vector2) {
// 	const fix = unit.cell.new();
// 	yield* c(c => unit.cell.set(fix.new().add(rpos.new().inc(c))), 200, 20);
// }
// function* unitScanAnim(unit: Unit) {
// 	yield* c(c => (unit.scaning_rad = c), 900, 20);
// }

const TIME = 1000;

const ENV = (module: MoveModule) => ({
	*turn(dir?: number): Iter {
		if(typeof dir !== 'number') throw new Error('"turn" invalid argumnets');
		yield [ID, 'turn', dir];
	},
	*moveForward(c: number): Iter {
		for(let i = 0; i < c; i++) {
			const code = yield [ID, 'moveForward'];
			if(typeof code === 'symbol') return code;
		}
	},
	*moveTo(target?: Vector2, steps: number = Math.INF): Iter {
		if(!target) throw new Error('"moveTo" invalid argumnets');
		if(module.owner.cell.isSame(target)) return false;

		for(let i = 0; i < steps; i++) {
			if(yield [ID, 'moveTo', target.new()]) continue;
			return false;
		}
	},
	get diration() { return module.owner.diration as any as () => TDiration; },
	getForwardCell(data?: IScanData) {
		if(typeof data === 'undefined') throw new Error('"getForwardCell" invalid argumnets');

		return data.find(it => it.pos.isSame(dirToVec2(module.owner.diration).add(module.owner.cell)));
	}
});

const API = {
	turn: (module, dir: number) => ({ time: TIME, task: () => { module.owner.diration += Math.sign(dir); }}),
	moveTo: (module, pos: Vector2) => ({
		time: module.canMoveToPos(module.owner.cell.new().sub(pos), 0.1) ? TIME : 100,
		task: () => module.moveTo(pos, 1)
	}),
	moveForward: (module) => ({ time: TIME, task: () => module.moveForward(1) })
} satisfies Record<string, (module: MoveModule, ...args: any) => APIResult<any>>;


class MoveModule extends Module<IOwner> {
	constructor(owner: IOwner) {
		super(ID, owner, API);
		this.ENV = ENV(this);
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
		return this.move(dirToVec2(this.owner.diration).inc(speed));
	}
}


modules[ID] = MoveModule;

declare module '../modules' {
	namespace modules {
		let move: typeof MoveModule;
	}
}
