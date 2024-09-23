import { Vector2 } from 'ver/Vector2';
import { Event, EventDispatcher } from 'ver/events';
import { codeShell } from 'ver/codeShell';
import {
	object as Object,
	math as Math,
	function_constructors,
	Generator,
	getTypeFunction,
	delay
} from 'ver/helpers';

import { Task } from './code/Executor';
import { EModule } from './world/EModule';

type rec_fns = {
	Function: (this: any, ...args: any) => any;
	AsyncFunction: (this: any, ...args: any) => Promise<any>;
	GeneratorFunction: (this: any, ...args: any) => Generator<any, any, any>;
	AsyncGeneratorFunction: (this: any, ...args: any) => AsyncGenerator<any, any, any>;
};
type entry_points<T extends Record<string, keyof typeof function_constructors>> = {
	[K in keyof T]: rec_fns[T[K]];
};

export interface IScript {
	(this: any, ...args: any): Generator<any, any, any>;
}
export interface IScriptAPI<This, Args extends any[], R> {
	run(_this: This, ...args: Args): this;
	reset(value: R): this;
	isStart(): boolean;
	isStop(): boolean;
	start(): boolean;
	stop(): boolean;
	toggle(f?: boolean): boolean;
	// throw(err: unknown);
	// return(value: R);
	// then: (...args: any) => o.then(...args),
	// catch: (...args: any) => o.catch(...args),
	// finally: (...args: any) => o.finally(...args)
};


export declare namespace Script {
	export type handler<T> = (owner: unknown, dt: number, time: number, value: any) => {
		time: number | null | void, data: T
	};
}
export class Script<This = any,
	const Args extends any[] = any[],
	const Iter extends Generator<any, any, any> = Generator<any, any, any>
> extends EventDispatcher implements Promise<Generator.TReturn<Iter>> {
	public '@start' = new Event<Script<This, Args, Iter>, []>(this);
	public '@stop' = new Event<Script<This, Args, Iter>, []>(this);
	public '@done' = new Event<Script<This, Args, Iter>, [value: Generator.TReturn<Iter>]>(this);
	public '@run' = new Event<Script<This, Args, Iter>, Args>(this);
	public '@reset' = new Event<Script<This, Args, Iter>, []>(this);

	public done: boolean = true;

	protected _isStart: boolean = false;
	public isStart() { return this._isStart; }
	public isStop() { return !this._isStart; }

	public iterator: Iter | null = null;
	public out_data!: Generator.TNext<Iter> | void;

	constructor(public generator: (this: This, ...args: Args) => Iter) { super(); }

	public next(value: Generator.TNext<Iter>) { return this.iterator!.next(value); }
	public throw(err: unknown) { return this.iterator!.throw(err); }
	public return(value: Generator.TReturn<Iter>) { return this.iterator!.return(value); }

	public start(): boolean {
		if(this._isStart) return false;
		this._isStart = true;

		this['@start'].emit();

		return true;
	}
	public stop(): boolean {
		if(!this._isStart) return false;
		this._isStart = false;
		this['@stop'].emit();

		return true;
	}
	public toggle(force?: boolean): void {
		if(typeof force === 'undefined') this._isStart ? this.stop() : this.start();
		else this._isStart === !force ? this.stop() : this.start();
	}

	public run(_this: This, ...args: Args): this {
		if(this.iterator || !this.done) throw new Error('Script not completed');

		this.iterator = this.generator.apply(_this, args);

		this.done = false;
		this._isStart = true;

		this['@run'].emit(...args);

		return this;
	}

	public reset(value: Generator.TReturn<Iter>): this {
		if(!this.iterator) return this;

		this.iterator.return(value);
		this.iterator = null;

		this.done = true;
		this._isStart = false;

		this['@reset'].emit();

		return this;
	}

	// public tick(dt: number, handler: Script.handler<Generator.TNext<Iter>>): void {
	// 	if(!this.iterator || this.done || !this._isStart) return;
	//
	// 	this.dt += dt;
	// 	if(this.dt < this.time) return;
	//
	// 	let delta = dt;
	//
	// 	while(true) {
	// 		const { done, value } = this.iterator.next(this.next_return);
	//
	// 		if(done) {
	// 			this['@tick'].emit();
	//
	// 			this._numberOfPlayed++;
	// 			this['@done'].emit(value);
	//
	// 			this.reset(value);
	// 			return;
	// 		}
	//
	// 		console.log({ delta, time: this.time });
	// 		const { time, data } = handler(this.owner, delta, this.time, value);
	// 		this.next_return = data;
	//
	// 		if(time === null) return;
	// 		if(typeof time === 'undefined') continue;
	//
	// 		this.dt -= this.time;
	// 		this.time = time;
	//
	// 		if(this.isTimeSync) {
	// 			if(time < 0 || time < this.MIN_TIME) throw new Error('The time cannot be zero or less MIN_TIME');
	//
	// 			if(this.dt >= time) {
	// 				delta = 0;
	// 				continue;
	// 			}
	// 		} else this.dt = 0;
	//
	// 		this['@tick'].emit();
	//
	// 		return;
	// 	}
	// }


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


export class CodeSpace<
	const ctx extends any,
	const env extends Record<string, any>,
	const args extends Record<string, any>,
	const entry extends Record<string, keyof typeof function_constructors>,
	const source extends string = string
> {
	public isActive: boolean = true;

	public code: string = '';
	public entry_points: entry_points<entry> = {} as any;

	public ctx: ctx; public env: env; public args: args; public entry: entry; public source: source;

	constructor({ ctx, env, args, entry, source }: { ctx: ctx, env: env, args: args, entry: entry, source: source }) {
		this.ctx = ctx;
		this.env = env;
		this.args = args;
		this.entry = entry;
		this.source = source;
	}

	public run(code: string): unknown {
		this.code = code;

		const env = Object.create(Object.fullassign({}, this.env, {
			Vector2,
			Math, JSON, console,
			Object, String, Number, Boolean, BigInt
		}));
		Object.defineProperty(env, 'global', { value: env, writable: false, enumerable: false, configurable: false });
		Object.defineProperty(env, CodeSpace.REG_SETTER, {
			set: (v: any) => {
				if(typeof v === 'function') {
					if(v.constructor === function_constructors[this.entry[v.name]]) {
						if(this.entry[v.name] === getTypeFunction(v)) (this.entry_points as any)[v.name] = v;
					} else throw new Error(`type function ${v.name} !== ${this.entry[v.name]}`);
				}
			}, enumerable: false, configurable: true
		});

		const entrys = (Object.keys(this.entry) as string[]).map(it => `global['${CodeSpace.REG_SETTER}'] = ${it}; `).join('');
		return codeShell(`${entrys}delete global['${CodeSpace.REG_SETTER}']; ${code}`, env, {
			arguments: Object.keys(this.args).join(', '),
			source: this.source
		}).apply(this.ctx, Object.values(this.args) as any);
	}


	public static readonly REG_SETTER = 'r e g i s t e r';
}


export class ScriptsSystem<const T extends EModule<any>[]> extends EventDispatcher {
	public scripts: [owner: CodeSpace<any, any, any, any>, token: symbol, script: Script][] = [];

	constructor(public executors: T) { super(); }

	public create_script(
		owner: CodeSpace<any, any, any, any>, token: symbol,
		_script: (this: any, ...args: any) => Generator<any, any, any>
	) {
		const script = new Script(_script);

		this.scripts.push([owner, token, script]);

		script.on('run', () => {
			this.script_next(owner, script);
		});

		const r = {
			run: (_this: any, ...args: any) => (script.run(_this, ...args), r),
			isStart: () => script.isStart(),
			isStop: () => script.isStop(),
			start: () => script.start(),
			stop: () => script.stop(),
			toggle: (v: any) => script.toggle(v),
			throw: (v: any) => script.throw(v),
			return: (v: any) => script.return(v),
			reset: (v: any) => (script.reset(v), r),
			then: (...args: any) => script.then(...args),
			catch: (...args: any) => script.catch(...args),
			finally: (...args: any) => script.finally(...args)
		};

		return r;
	}
	public clear_scripts(token: symbol) {
		let l; while(~(l = this.scripts.findIndex(([, token_]) => token_ === token))) this.scripts.splice(l, 1)[0][2].reset(void 0);
	}

	public async script_next(owner: CodeSpace<any, any, any, any>, script: Script) {
		console.groupEnd();
		// if(!owner.isActive || !script.iterator || script.isStop()) return;

		const { done, value } = script.next(script.out_data);
		if(done) return void script.reset(value);

		console.group(script.generator.name, value);

		let promise: Task<any> | Promise<any>;

		if(value[0] === null) {
			const [, id, ...args] = value as [string, string, ...any[]];
			if(id === 'delay') promise = delay(...args);
			throw 0;
		} else {
			const [module_id, id, ...args] = value as [string, string, ...any[]];
			const module = this.executors.find(it => it.module_id === module_id);

			if(!module) throw new Error('unknown module');
			promise = module.request(id, ...args);
		}

		promise.then(data => {
			if(script.done) return;
			script.out_data = data;
			this.script_next(owner, script);
		});
	}
}
