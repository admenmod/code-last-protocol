import { Event } from 'ver/events';
import { object as Object, Fn } from 'ver/helpers';

import { CodeSpace, IScript, ScriptsSystem } from '@/ScriptsSystem';
import { CODE } from './code';
import { EModule } from '@/world/EModule';
import { Entity } from '@/world/Entity';


interface ICodeEnv {}
type IUnitCodeEntry = { __start__: 'Function', __transfer__: 'Function' };

export class Evaluetor<ctx> extends CodeSpace<ctx, ICodeEnv, typeof CODE, IUnitCodeEntry> {
	public events: Record<string, Event> = Object.create(null);
	public scripts = new Map<IScript, ReturnType<ScriptsSystem<any>['create_script']>>;

	public scripts_system: ScriptsSystem<any>;

	constructor(modules: EModule<Entity>[] = [], ctx: ctx, _env: ICodeEnv, source: string) {
		const script = Object.assign((script: IScript) => this.create_script(script), {
			mono: (s: IScript) => {
				const api = this.scripts.get(s) || script(s);
				if(!this.scripts.has(s)) this.scripts.set(s, api);
				return api;
			}
		});

		const on = (id: string, fn: Fn, priority?: number, tag?: string | symbol, once?: boolean, shift?: boolean) => {
			if(!(id in this.events)) this.events[id] = new Event(ctx);
			return this.events[id].on(fn, priority, tag, once, shift);
		};
		const once = (id: string, fn: Fn, priority?: number, tag?: string | symbol, shift?: boolean) => {
			return on(id, fn, priority, tag, true, shift);
		};
		const off = (id: string, fn?: Fn | string | symbol) => {
			if(!(id in this.events)) return;
			return this.events[id].off(fn as any);
		};
		const emit = (id: string, ...args: any) => {
			if(!(id in this.events)) return;
			return this.events[id].emit(...args);
		};

		const env = Object.fullassign({}, _env, {
			memory: Object.create(null),
			on, once, off, emit,
			script, delay: function* (...args: any): any { return yield [null, 'delay', ...args]; }
		});

		super({ ctx, env, args: { ...CODE }, entry: { __start__: 'Function', __transfer__: 'Function' }, source });

		this.scripts_system = new ScriptsSystem(modules);
	}

	public create_script!: (script: IScript) => ReturnType<typeof this.scripts_system.create_script>;

	#prev_symbol!: symbol;
	public override run(this: Evaluetor<ctx>, code: string) {
		const symbol = Symbol(`unique symbol [${this.source}]`);

		this.scripts.clear();

		for(const id in this.events) {
			this.events[id].off();
			delete this.events[id];
		}

		if(this.#prev_symbol) this.scripts_system.clear_scripts(this.#prev_symbol);

		this.create_script = script => this.scripts_system.create_script(this, symbol, script);

		const r = super.run(code);
		const __start__ = this.entry_points.__start__;

		if(!__start__) throw new Error('function "__start__" is not found');
		__start__.apply(this.ctx);

		this.#prev_symbol = symbol;

		return r;
	}
}
