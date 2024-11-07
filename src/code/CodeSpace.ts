import { Vector2 } from 'ver/Vector2';
import { codeShell } from 'ver/codeShell';
import { function_constructors, getTypeFunction, object as Object } from 'ver/helpers';


type rec_fns = {
	Function: (this: any, ...args: any) => any;
	AsyncFunction: (this: any, ...args: any) => Promise<any>;
	GeneratorFunction: (this: any, ...args: any) => Generator<any, any, any>;
	AsyncGeneratorFunction: (this: any, ...args: any) => AsyncGenerator<any, any, any>;
};
type entry_points<T extends Record<string, keyof typeof function_constructors>> = {
	[K in keyof T]: rec_fns[T[K]];
};

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
