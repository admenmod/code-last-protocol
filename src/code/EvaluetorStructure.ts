import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import { Fn, math as Math } from 'ver/helpers';

import { Evaluetor } from './Evaluetor';

import type { IScanData, World } from '@/scenes/World';
import type { Structure } from '@/world/structure';

type Iter = Generator<[string, ...any[]], any, any>;


const TIME = 1000;

export class EvaluetorStructure extends Evaluetor<Iter> {
	public api: Record<string, (this: any, ...args: any) => { time: number, data: any }> = {};

	constructor(code: string, public world: World, public structure: Structure) {
		const events: Record<string, Event> = {};

		const on = (id: string, fn: Fn, priority?: number, tag?: string | symbol, once?: boolean, shift?: boolean) => {
			if(!(id in events)) events[id] = Object.create(null);
			return events[id].on(fn, priority, tag, once, shift);
		};
		const once = (id: string, fn: Fn, priority?: number, tag?: string | symbol, shift?: boolean) => {
			if(!(id in events)) events[id] = Object.create(null);
			return events[id].on(fn, priority, tag, true, shift);
		};
		const off = (id: string, fn?: Fn | string | symbol) => {
			if(!(id in events)) events[id] = Object.create(null);
			return events[id].off(fn as any);
		};
		const emit = (id: string, ...args: any) => {
			if(!(id in events)) return;
			return events[id].emit(...args);
		};

		const ctx = { on, once, off, emit };

		const env = {
			...ctx,
			*scan(): Iter { return yield ['scan']; },
			*extract(): Iter { return yield ['extract']; },
			get cargo_filled() { return world.resources_cargo.get(structure)!.fullness_normaloze > 0.9; },
			get diration() { return structure.diration; },
			on() {},
			set pub(_v: any) {},
			c: { *run(gen: any, ...args: any) { yield* gen.apply(ctx, args); } },
			memory: {},
			console, Math, JSON
		};

		super({ code, ctx, env, source: () => 'user/structure.js', handler: (dt, id, ctx, ...args) => {
			console.group({ dt, id, ctx, args });
			if(id in this.api) {
				const data =  this.api[id].apply(typeof ctx !== 'undefined' ? ctx : null, args);
				console.groupEnd();
				return data;
			}

			throw new Error(`invalid request api[${id}]`);
		} });

		this.api = {
			scan: () => ({ time: TIME, data: world.structureRadarScan(structure) }),
			extract: () => ({ time: TIME, data: world.structureExtract(structure) })
		};
	}
}
