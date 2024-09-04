import { Event, EventDispatcher } from 'ver/events';
import { codeShell } from 'ver/codeShell';


export declare namespace Generator {
	export type T<T extends Generator<any, any, any>> = T extends Generator<infer R, any, any> ? R : never;
	export type TReturn<T extends Generator<any, any, any>> = T extends Generator<any, infer R, any> ? R : never;
	export type TNext<T extends Generator<any, any, any>> = T extends Generator<any, any, infer R> ? R : never;
}


export class Evaluetor<Iter extends Generator<any, any, any> = Generator<any, any, any>> extends EventDispatcher {
	public '@run' = new Event<Evaluetor<Iter>, []>(this);


	protected _isRunned: boolean = false;
	public isRunned() { return this._isRunned; }
	public isStoped() { return !this._isRunned; }

	protected dt: number = 0;
	protected time: number = 0;

	protected next_return?: Generator.TNext<Iter>;

	public done: boolean = true;
	public iterator: Iter | null = null;

	public isTimeSync: boolean = true;
	public readonly MIN_TIME: number = 1;

	public code: string;
	public env: any;
	public ctx: any;
	public source: () => string;
	public handler: (dt: number, ...args: Generator.T<Iter>) => { time: number, data: Generator.TNext<Iter> };
	public handler_start_yield: (data: Generator.TNext<Iter>) => any = () => {};

	constructor({ code, ctx, env, source, handler, handler_start_yield }: {
		code: string,
		ctx: any,
		env: object,
		source: () => string,
		handler: Evaluetor['handler']
		handler_start_yield?: Evaluetor['handler_start_yield']
	}) {
		super();

		this.code = code;
		this.ctx = ctx;
		this.env = env;
		this.source = source;
		this.handler = handler;
		if(handler_start_yield) this.handler_start_yield = handler_start_yield;
	}

	public throw(err: unknown) { this.iterator?.throw(err); }

	public run(): this {
		if(this.iterator || !this.done || this._isRunned) throw new Error('evaluetor not completed');

		try {
			this.iterator = codeShell<() => () => Iter>(this.code, this.env, {
				source: this.source()
			}).call(this.ctx).call(this.ctx);
		} catch(err) {
			console.error(err);
			return this;
		}

		this.done = false;
		this._isRunned = true;

		const { done, value } = this.iterator.next();
		if(!done) {
			this.time = 0;
			this.handler_start_yield(value);
		} else throw new Error('invalid evaluetor');

		this['@run'].emit();

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

			const { time, data } = this.handler(delta, ...value);

			this.next_return = data;

			this.dt -= this.time;
			this.time = time;

			if(this.isTimeSync) {
				if(time < 0 || time < this.MIN_TIME) throw new Error('The time cannot be zero or less MIN_TIME');

				if(this.dt >= time) {
					delta = 0;
					continue;
				}
			} else this.dt = 0;

			return;
		}
	}
}
