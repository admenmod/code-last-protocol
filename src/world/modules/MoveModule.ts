import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import { EModule } from '../EModule';
import { IScanData, World } from '@/scenes/World';
import { Unit } from '../unit';
import { APIResult } from '@/code/Executor';
import { dirToVec2 } from '@/utils/cell';
import { c } from '@/animations';


export interface IMoveModuleOwner {
	cell: Vector2;
	size: Vector2;
}

type Iter = Generator<[string, ...any[]], any, any>;


function* unitMoveAnim(unit: Unit, rpos: Vector2) {
	const fix = unit.cell.new();
	yield* c(c => unit.cell.set(fix.new().add(rpos.new().inc(c))), 200, 20);
}
// function* unitScanAnim(unit: Unit) {
// 	yield* c(c => (unit.scaning_rad = c), 900, 20);
// }

const ID = 'move';

const TIME = 1000;

const ENV = (_world: World, unit: Unit) => ({
	*turn(dir: number): Iter { yield [ID, 'turn', dir]; },
	*moveForward(c: number): Iter {
		for(let i = 0; i < c; i++) {
			const code = yield [ID, 'moveForward'];
			if(typeof code === 'symbol') return code;
		}
	},
	*moveTo(target?: Vector2, steps: number = Math.INF): Iter {
		if(!target) throw new Error('"moveTo" invalid argumnets '+String(target));
		if(unit.cell.isSame(target)) return false;

		for(let i = 0; i < steps; i++) {
			if(yield [ID, 'moveTo', target.new()]) continue;
			return false;
		}
	},
	get diration() { return unit.diration; },
	getForwardCell(unit?: Unit, data?: IScanData) {
		if(typeof unit === 'undefined' || typeof data === 'undefined') throw new Error('"getForwardCell" invalid argumnets');

		return data.find(it => it.pos.isSame(dirToVec2(unit.diration).add(unit.cell)));
	}
});

const API = (world: World, unit: Unit) => ({
	turn: (dir: any) => ({ time: TIME, task: () => { unit.diration += Math.sign(dir); } }),
	moveTo: (pos: Vector2) => ({ time: world.canMoveToPos(unit, unit.cell.new().sub(pos)) ? TIME : 100, task: () => world.moveTo(unit, pos, 1) }),
	moveForward: () => ({ time: TIME, task: () => world.moveForward(unit, 1) })
}) satisfies Record<string, (...args: any) => APIResult<any>>;

export class MoveModule<T extends IMoveModuleOwner> extends EModule<T> {
	constructor(world: World, owner: T) {
		super(ID, owner, ENV(world, owner as any as Unit), API(world, owner as any as Unit));
	}
}
