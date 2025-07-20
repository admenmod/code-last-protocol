import { Event, EventDispatcher } from 'ver/events';
import { Fn, object as Object } from 'ver/helpers';

import { modules, mod_env, mod_st } from '@/modules';
import { Module } from '@/modules/Module';
import type { APIResult } from '@/code/Executor';
import { CODE } from '@/code/code';
import { Entity } from '@/game/Entity';

import { Generator, delay } from 'ver/helpers';

import { Task } from '@/code/Executor';
import { CodeSpace } from '@/code/CodeSpace';
import { object } from '@/utils/strc-types';


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


const ID = 'script';
type ID = typeof ID;

// type Iter = Generator<[ID, string, ...any[]], any, any>;

export declare namespace ScriptModule {
	export interface IOwner extends Entity<[ID]> {}
}

type IOwner = ScriptModule.IOwner;

const st_model = object({});

// const TIME = 1000;

const ENV = (module: ScriptModule) => {
	const script = Object.assign((script: IScript) => module.create_script(script), {
		mono: (s: IScript) => {
			const api = module.scripts.get(s) || script(s);
			if(!module.scripts.has(s)) module.scripts.set(s, api);
			return api;
		},
		*delay(...args: Parameters<typeof delay>) { yield [ID, 'delay', ...args] }
	});

	return {
		script,
		get memory() { return module.memory; },
		*delay(...args: Parameters<typeof delay>) { yield [null, 'delay', ...args] } };
};

const API = {
	delay: (_module, ...args: Parameters<typeof delay>) => ({ time: null, task: () => delay(...args) })
} satisfies Record<string, (module: ScriptModule, ...args: any) => APIResult<any>>;


type ctx = any;
interface ICodeEnv {}
type IUnitCodeEntry = { __start__: 'Function', __transfer__: 'Function' };

class ScriptModule extends Module<ID, IOwner> {
	public memory = Object.create(null);

	public ctx: ctx = null;
	public env: Record<string, any> = Object.create(null);
	public args = { ...CODE };
	// HACK:
	public source = 'script';

	public _events: Record<string, Event> = Object.create(null);
	public _scripts: Script[] = [];

	public scripts = new Map<IScript, ReturnType<this['create_script']>>;

	public codespace!: CodeSpace<ctx, ICodeEnv, typeof CODE, IUnitCodeEntry>;

	constructor(owner: IOwner) {
		super(ID, owner, API);

		this.ready.once(() => {
			for(const module of owner.modules) Object.fullassign(this.env, mod_env[module.id](module as any));

			const on = (id: string, fn: Fn, priority?: number, tag?: string | symbol, once?: boolean, shift?: boolean) => {
				if(!(id in this._events)) this._events[id] = new Event(this.ctx);
				return this._events[id].on(fn, priority, tag, once, shift);
			};
			const once = (id: string, fn: Fn, priority?: number, tag?: string | symbol, shift?: boolean) => {
				return on(id, fn, priority, tag, true, shift);
			};
			const off = (id: string, fn?: Fn | string | symbol) => {
				if(!(id in this._events)) return;
				return this._events[id].off(fn as any);
			};
			const emit = (id: string, ...args: any) => {
				if(!(id in this._events)) return;
				return this._events[id].emit(...args);
			};

			Object.assign(this.env, { on, once, off, emit });

			this.codespace = new CodeSpace({
				ctx: this.ctx, env: this.env, args: this.args, source: this.source,
				entry: { __start__: 'Function', __transfer__: 'Function' }
			});
		});
	}

	public run(code: string) {
		for(const id in this._events) {
			this._events[id].off();
			delete this._events[id];
		}

		this.clear_scripts();
		this.scripts.clear();

		const r = this.codespace.run(code);
		const __start__ = this.codespace.entry_points.__start__;

		if(!__start__) throw new Error('function "__start__" is not found');
		__start__.apply(this.ctx);

		return r;
	}

	public create_script(_script: (this: any, ...args: any) => Generator<any, any, any>) {
		const script = new Script(_script);
		this._scripts.push(script);

		script.on('run', () => void this.script_next(script));

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
	public clear_scripts() {
		for(let i = this._scripts.length - 1; i >= 0; --i) this._scripts[i].reset(CODE.FORCED_RETURN);
	}

	public async script_next(script: Script) {
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
			const module = this.owner.modules.find(it => it.id === module_id);

			if(!module) throw new Error('unknown module');
			promise = module.request(id, ...args);
		}

		promise.then(data => {
			if(script.done) return;
			script.out_data = data;
			this.script_next(script);
		});
	}
}


mod_env[ID] = ENV;
mod_st[ID] = st_model;
modules[ID] = ScriptModule;

declare module '@/modules' {
	namespace mod_env { let script: typeof ENV; }
	namespace mod_st { let script: typeof st_model; }
	namespace modules { let script: typeof ScriptModule; }
}
