import { Event, EventDispatcher } from 'ver/events';
import { Generator } from 'ver/helpers';


export declare namespace Coroutin {
	export type handler<T> = (owner: unknown, dt: number, time: number, value: any) => {
		time: number | null | void, data: T
	};
}
export class Coroutin<This = any,
	const Args extends any[] = any[],
	const Iter extends Generator<any, any, any> = Generator<any, any, any>
> extends EventDispatcher implements Promise<Generator.TReturn<Iter>> {
	public static readonly MIN_TIME: number = 5 as const;

	public '@play' = new Event<Coroutin<This, Args, Iter>, []>(this);
	public '@pause' = new Event<Coroutin<This, Args, Iter>, []>(this);
	public '@done' = new Event<Coroutin<This, Args, Iter>, [value: Generator.TReturn<Iter>]>(this);
	public '@tick' = new Event<Coroutin<This, Args, Iter>, []>(this);
	public '@run' = new Event<Coroutin<This, Args, Iter>, Args>(this);
	public '@reset' = new Event<Coroutin<This, Args, Iter>, []>(this);

	public done: boolean = true;

	protected dt: number = 0;
	protected time: number = 0;

	protected _numberOfPlayed: number = 0;
	public get numberOfPlayed() { return this._numberOfPlayed; }

	protected _isStart: boolean = false;
	public isStart() { return this._isStart; }
	public isStop() { return !this._isStart; }

	public isTimeSync: boolean = true;
	public readonly MIN_TIME: number = Coroutin.MIN_TIME;

	public iterator: Iter | null = null;
	private next_return!: Generator.TNext<Iter>;

	constructor(public owner: unknown, public generator: (this: This, ...args: Args) => Iter) { super(); }

	public throw(err: unknown) { return this.iterator?.throw(err); }
	public return(value: Generator.TReturn<Iter>) { return this.iterator?.return(value); }

	public start(): boolean {
		if(this._isStart) return false;
		this._isStart = true;

		this['@play'].emit();

		return true;
	}
	public stop(): boolean {
		if(!this._isStart) return false;
		this._isStart = false;
		this['@pause'].emit();

		return true;
	}
	public toggle(force?: boolean): void {
		if(typeof force === 'undefined') this._isStart ? this.stop() : this.start();
		else this._isStart === !force ? this.stop() : this.start();
	}

	public run(_this: This, ...args: Args): this {
		if(this.iterator || !this.done || this._isStart) throw new Error('animation not completed');

		this.iterator = this.generator.apply(_this, args);

		this.done = false;
		this._isStart = true;

		const { done, value } = this.iterator.next();
		if(!done) this.time = value || 0;
		else throw new Error('invalid animation');

		this['@run'].emit(...args);

		return this;
	}

	public reset(value: Generator.TReturn<Iter>): this {
		if(!this.iterator) return this;

		this.iterator.return(value);
		this.iterator = null;

		this.dt = 0;
		this.done = true;
		this._isStart = false;

		this['@reset'].emit();

		return this;
	}

	public tick(dt: number, handler: Coroutin.handler<Generator.TNext<Iter>>): void {
		if(!this.iterator || this.done || !this._isStart) return;

		this.dt += dt;
		if(this.dt < this.time) return;

		let delta = dt;

		while(true) {
			const { done, value } = this.iterator.next(this.next_return);

			if(done) {
				this['@tick'].emit();

				this._numberOfPlayed++;
				this['@done'].emit(value);

				this.reset(value);
				return;
			}

			console.log({ delta, time: this.time });
			const { time, data } = handler(this.owner, delta, this.time, value);
			this.next_return = data;

			if(time === null) return;
			if(typeof time === 'undefined') continue;

			this.dt -= this.time;
			this.time = time;

			if(this.isTimeSync) {
				if(time < 0 || time < this.MIN_TIME) throw new Error('The time cannot be zero or less MIN_TIME');

				if(this.dt >= time) {
					delta = 0;
					continue;
				}
			} else this.dt = 0;

			this['@tick'].emit();

			return;
		}
	}


	public then<T1 extends Generator.TReturn<Iter> = Generator.TReturn<Iter>, T2 = never>(
		onfulfilled?: ((value: T1) => T1 | PromiseLike<T1>) | null | undefined,
		onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null | undefined
	): Promise<T1 | T2> {
		if(!this.iterator || this.done) return (Promise.resolve() as Promise<T1>).then(onfulfilled, onrejected);
		return new Promise<T1>(res => this['@done'].once(value => res(value))).then(onfulfilled, onrejected);
	}

	public catch<T = never>(
		onrejected?: ((reason: any) => T | PromiseLike<T>) | null | undefined
	): Promise<Generator.TReturn<Iter> | T> {
		if(!this.iterator || this.done) return Promise.resolve().then(null, onrejected);
		return new Promise(res => this['@done'].once(value => res(value))).then(null, onrejected);
	}

	public finally(onfinally?: (() => void) | null | undefined): Promise<Generator.TReturn<Iter>> {
		const h = (value: any) => (onfinally?.(), value);
		if(!this.iterator || this.done) return Promise.resolve().then(h, h);
		return new Promise(res => this['@done'].once(value => res(value))).then(h, h);
	}
}
