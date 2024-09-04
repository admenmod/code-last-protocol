import { math as Math } from 'ver/helpers';

import { Evaluetor } from './Evaluetor';

import type { World } from '@/scenes/World';
import type { Unit } from '@/world/unit';
import { Vector2 } from 'ver/Vector2';

type Iter = Generator<[string, ...any[]], any, any>;


const TIME = 1000;

export class EvaluetorUnit extends Evaluetor<Iter> {
	public api: Record<string, (this: any, ...args: any) => { time: number, data: any }> = {};

	constructor(code: string, public world: World, public unit: Unit) {
		const ctx = unit;

		const env = {
			...ctx,
			console, Math,
			*moveForward(c: number): Iter { for(let i = 0; i < c; i++) yield ['moveForward']; },
			*turn(dir: number): Iter { yield ['turn', null, dir]; },
			*scan(): Iter { return yield ['scan']; },
			*moveTo(target?: Vector2, steps: number = Math.INF): Iter {
				if(!target) throw new Error('"moveTo" invalid argumnets '+String(target));
				if(unit.cell.isSame(target)) return false;

				for(let i = 0; i < steps; i++) {
					if(yield ['moveTo', null, target.new()]) continue;
					return false;
				}
			},
			*extract(): Iter { return yield ['extract']; },
			get cargo_filled() {
				return world.resources_cargo.get(unit)!.fullness_normaloze > 0.9;
			},
			memory: {
				base_position: new Vector2(0, 0)
			},
			on() {},
			set pub(_v: any) {},
			c: {
				*run(gen: any, ...args: any) { yield* gen(...args); }
			}
		};

		super({ code, ctx, env, source: () => 'user/unit.js', handler: (dt, id, ctx, ...args) => {
			console.group({ dt, id, ctx, args });
			if(id in this.api) {
				const data =  this.api[id].apply(typeof ctx !== 'undefined' ? ctx : null, args);
				console.groupEnd();
				return data;
			}

			throw new Error(`invalid request api[${id}]`);
		} });

		this.api = {
			scan: () => ({ time: TIME, data: world.unitRadarScan(unit) }),
			moveTo: (pos: Vector2) => ({ time: TIME, data: world.moveTo(unit, pos, 1) }),
			moveForward: () => ({ time: TIME, data: world.moveForward(unit, 1) }),
			turn: (dir: any) => ({ time: TIME, data: unit.diration += Math.sign(dir) }),
			extract: () => ({ time: TIME, data: world.unitExtract(unit, Vector2.ZERO) })
		};
	}
}
