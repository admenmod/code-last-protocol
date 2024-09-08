import { function_constructors, Generator, getTypeFunction } from 'ver/helpers';
import { MainLoop } from 'ver/MainLoop';
import { codeShell } from 'ver/codeShell';

import { Coroutin } from './code/Coroutin';

type RecFns = {
	Function: (this: any, ...args: any) => any;
	AsyncFunction: (this: any, ...args: any) => Promise<any>;
	GeneratorFunction: (this: any, ...args: any) => Generator<any, any, any>;
	AsyncGeneratorFunction: (this: any, ...args: any) => AsyncGenerator<any, any, any>;
};
type entru_points<T extends Record<string, keyof typeof function_constructors>> = {
	[K in keyof T]: RecFns[T[K]];
};


const REG_SETTER = 'r e g i s t e r';

export class CodeEnv<
	const ctx extends any,
	const env extends Record<string, any>,
	const args extends Record<string, any>,
	const entry extends Record<string, keyof typeof function_constructors>,
	const source extends string = string
> {
	public ctx: ctx;
	public env: env;
	public args: args;
	public entry: entry;
	public source: source;

	constructor({ ctx, env, args, entry, source }: { ctx: ctx, env: env, args: args, entry: entry, source: source }) {
		this.ctx = ctx;
		this.env = env;
		this.args = args;
		this.entry = entry;
		this.source = source;
	}

	public code: string = '';
	public entru_points: entru_points<entry> = {} as any;
	public run(code: string): unknown {
		this.code = code;

		const env = Object.create({ ...this.env, Math, JSON, console });
		Object.defineProperty(env, 'global', { value: env, writable: false, enumerable: false, configurable: false });
		Object.defineProperty(env, REG_SETTER, {
			set: (v: any) => {
				if(typeof v === 'function') {
					if(v.constructor === function_constructors[this.entry[v.name]]) {
						if(this.entry[v.name] === getTypeFunction(v)) (this.entru_points as any)[v.name] = v;
					} else throw new Error(`type function ${v.name} !== ${this.entry[v.name]}`);
				}
			}, enumerable: false, configurable: true
		});

		const entrys = Object.keys(this.entry).map(it => `global['${REG_SETTER}'] = ${it}; `).join('');
		return codeShell(`${entrys}delete global['${REG_SETTER}']; ${code}`, env, {
			arguments: Object.keys(this.args).join(', ')
		}).apply(this.ctx, Object.values(this.args) as any);
	}
}


export class ScriptsSystem extends MainLoop {
	public coroutins: [token: symbol, coroutin: Coroutin][] = [];

	constructor() {
		super({ fps: 400 });

		this['@update'].on(dt => {
			for(let i = 0; i < this.coroutins.length; i++) this.coroutins[i][1].tick(dt);
		});
	}

	public coroutin(token: symbol, coroutin: (this: any, ...args: any) => Generator<any, any, any>) {
		const o = new Coroutin(coroutin);

		this.coroutins.push([token, o]);

		const r = Object.assign(async function(this: any, ...args: any) { return o.generator.apply(this, args); }, {
			run: (_this: any, ...args: any) => (o.run(_this, ...args), r),
			isStart: () => o.isStart(),
			isStop: () => o.isStop(),
			start: () => o.start(),
			stop: () => o.stop(),
			toggle: (v: any) => o.toggle(v),
			throw: (v: any) => o.throw(v),
			return: (v: any) => o.return(v),
			reset: (v: any) => (o.reset(v), r),
			then: (...args: any) => o.then(...args),
			catch: (...args: any) => o.catch(...args),
			finally: (...args: any) => o.finally(...args)
		});

		return r;
	}

	public deleteCoroutins(token: symbol) {
		let l; while(~(l = this.coroutins.findIndex(([token_]) => token_ == token))) this.coroutins.splice(l, 1);
	}
}


// export class Coroutin<Iter extends Generator<any, any, any> = Generator<any, any, any>> {
// 	#iterator: Iter;
//
// 	#isRunned: boolean = true;
// 	public isRunned() { return this.#isRunned; }
// 	public isStoped() { return !this.#isRunned; }
//
// 	#dt: number = 0;
// 	#time: number = 0;
//
// 	#next_return?: Generator.TNext<Iter>;
//
// 	#done: boolean = false;
// 	public get done() { return this.#done; }
//
// 	public isTimeSync: boolean = true;
// 	public readonly MIN_TIME: number = 1;
//
// 	constructor(iterator: Iter, public handler: (...args: any) => { time: number, data: any }) {
// 		this.#iterator = iterator;
// 	}
//
// 	public next(value: Generator.TNext<Iter>) { return this.#iterator.next(value); }
// 	public return(value: Generator.TReturn<Iter>) { return this.#iterator.return(value); }
// 	public throw(err: unknown) { return this.#iterator.throw(err); }
//
// 	public tick(dt: number): void {
// 		if(this.#done || !this.#isRunned) return;
//
// 		this.#dt += dt;
// 		if(this.#dt < this.#time) return;
//
// 		let delta = dt;
//
// 		while(true) {
// 			const { done, value } = this.#iterator.next(this.#next_return);
//
// 			if(done) {
// 				this.#done = true;
// 				this.#isRunned = false;
// 				return;
// 			}
//
// 			const { time, data } = this.handler(delta, ...value);
//
// 			this.#next_return = data;
//
// 			this.#dt -= this.#time;
// 			this.#time = time;
//
// 			if(this.isTimeSync) {
// 				if(time < 0 || time < this.MIN_TIME) throw new Error('The time cannot be zero or less MIN_TIME');
//
// 				if(this.#dt >= time) {
// 					delta = 0;
// 					continue;
// 				}
// 			} else this.#dt = 0;
//
// 			return;
// 		}
// 	}
// }
