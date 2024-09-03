import { Event, EventDispatcher } from 'ver/events';
import { codeShell } from 'ver/codeShell';

import { World } from '@/scenes/World';
import { Unit } from '@/world/unit';

type Iter = Generator<[string, ...any[]], any, any>;

const MOKE_TIME = 1000;


export class Evaluetor extends EventDispatcher {
	protected _isRunned: boolean = false;
	public isRunned() { return this._isRunned; }
	public isStoped() { return !this._isRunned; }

	protected dt: number = 0;
	protected time: number = 0;

	protected next_return: any;

	public done: boolean = true;
	public iterator: Iter | null = null;

	public isTimeSync: boolean = true;
	public readonly MIN_TIME: number = 1;

	public env: any;
	public ctx: any;
	public api: Record<string, (this: any, ...args: any) =>  any>;

	constructor(public code: string, public world: World, public unit: Unit) {
		super();

		this.api = {
			scan: () => world.unitRadarScan(unit),
			moveForward: () => world.moveForward(unit, 1),
			turn: (dir: any) => unit.diration += Math.sign(dir)
		};

		this.ctx = {};

		this.env = {
			console,
			...this.ctx,
			*moveForward(c: number): Iter { for(let i = 0; i < c; i++) yield ['moveForward']; },
			*scan(): Iter { return yield ['scan']; },
			*moveTo(): Iter { yield ['moveTo']; },
			*extract(): Iter { yield ['extract']; },
			get cargo_filled() { return world.resources_cargo.get(unit)!.reduce((acc, value) => value.count + acc, 0); },
			memory: {},
			on() {},
			set pub(v: any) {},
			c: {
				*run(gen: any, ...args: any) { yield* gen(...args); }
			}
		};
	}

	public run(): this {
		if(this.iterator || !this.done || this._isRunned) throw new Error('animation not completed');

		try {
			this.iterator = codeShell<() => () => Iter>(this.code, this.env, {
				source: 'user/unit.js'
			}).call(this.ctx).call(this.ctx);
		} catch(err) {
			console.error(err);
			return this;
		}

		this.done = false;
		this._isRunned = true;

		const { done, value } = this.iterator.next();
		if(!done) this.time = 0;
		// HACK: if(!done) this.time = value || 0;
		else throw new Error('invalid animation');

		return this;
	}

	public reset(): this {
		if(!this.iterator) return this;

		(this.iterator as any).return();
		this.iterator = null;

		this.dt = 0;
		this.done = true;
		this._isRunned = false;

		return this;
	}

	public tick(dt: number): void {
		if(!this.iterator || this.done || !this._isRunned) return;

		this.dt += dt;
		if(this.dt < this.time) return;

		let delta = dt;

		while(true) {
			const { done, value } = this.iterator.next(this.next_return);

			if(done) {
				this.reset();
				return;
			}

			const time = MOKE_TIME;
			const [id, ctx, ...args] = value;
			console.log({ id, ctx, args });

			const fn = this.api[id];

			if(fn) this.next_return = fn.apply(typeof ctx !== 'undefined' ? ctx : null, args);
			else {
				this.next_return = void 0;
				console.error(`invalid request api (${id})`);
			}

			this.dt -= this.time;
			this.time = time;

			if(this.isTimeSync) {
				if(time < 0 || time < this.MIN_TIME) throw new Error('The time cannot be zero or less MIN_TIME');

				if(this.dt >= time) {
					delta = 0;
					// continue;
					// HACK:
					return;
				}
			} else this.dt = 0;

			return;
		}
	}
}
