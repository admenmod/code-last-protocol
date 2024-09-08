import { Event } from 'ver/events';
import { Fn, math as Math, delay } from 'ver/helpers';

import { Evaluetor } from './Evaluetor';

import type { IScanData, World } from '@/scenes/World';
import type { Unit } from '@/world/unit';
import { Vector2 } from 'ver/Vector2';
import { dirToVec2 } from '@/utils/cell';

type Iter = Generator<[string, ...any[]], any, any>;


const TIME = 1000;

export class EvaluetorUnit extends Evaluetor<Unit> {
	public api: Record<string, (this: any, ...args: any) => { time: number, data: any }> = {};

	constructor(code: string, public world: World, public unit: Unit) {
		const events: Record<string, Event> = {};

		const on = (id: string, fn: Fn, priority?: number, tag?: string | symbol, once?: boolean, shift?: boolean) => {
			if(!(id in events)) events[id] = new Event(ctx);
			return events[id].on(fn, priority, tag, once, shift);
		};
		const once = (id: string, fn: Fn, priority?: number, tag?: string | symbol, shift?: boolean) => {
			return on(id, fn, priority, tag, true, shift);
		};
		const off = (id: string, fn?: Fn | string | symbol) => {
			if(!(id in events)) return;
			return events[id].off(fn as any);
		};
		const emit = (id: string, ...args: any) => {
			if(!(id in events)) return;
			return events[id].emit(...args);
		};

		const ctx = { on, once, off, emit };


		const env = { ...ctx,
			set __register__(v: any) { console.log(v?.name, v); },
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
			},
			on, once, off, emit,
			set pub(_v: any) {},
			c: { *run(gen: any, ...args: any) { yield* gen.apply(ctx, args); } },
			memory: { base_position: new Vector2(0, 0) },
			console, Math, JSON, delay
		};

		super(ctx, env, 'user/unit.js', (dt, id, ctx, ...args) => {
			console.group({ dt, id, ctx, args });
			if(id in this.api) {
				const data =  this.api[id].apply(typeof ctx !== 'undefined' ? ctx : null, args);
				console.groupEnd();
				return data;
			}

			throw new Error(`invalid request api[${id}]`);
		});

		this.api = {
			scan: () => ({ time: TIME, data: world.unitRadarScan(unit) }),
			moveTo: (pos: Vector2) => ({ time: TIME, data: world.moveTo(unit, pos, 1) }),
			moveForward: () => ({ time: TIME, data: world.moveForward(unit, 1) }),
			turn: (dir: any) => ({ time: TIME, data: unit.diration += Math.sign(dir) }),
			extract: () => ({ time: TIME, data: world.unitExtract(unit, Vector2.ZERO) }),
			transfer: (target: Vector2) => ({ time: TIME, data: world.transfer(unit, target) })
		};
	}
}
