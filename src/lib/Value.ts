import { Event, EventDispatcher } from 'ver/events';


interface evaluator<R, V> {
	(value: V): R;
	[Dependencies]?: Value<any, any>[];
}

export type pickT<T> =
T extends Value<infer R, any> ?
	R extends Value<any, any> ?
		pickT<R>
	: R
: T;
type pickT_never<T> =
T extends Value<infer R, any> ?
	R extends Value<any, any> ?
		pickT<R>
	: R
: T;

type NotValue<T> = T extends Value<any, any> ? never : T;


export const Ref = Symbol(`Value::Ref`);
export const Type = Symbol(`Value::Type`);
export const Dependencies = Symbol(`Value::Dependencies`);

export const TYPE_REF= Symbol(`Value::TYPE_REF`);
export const TYPE_EVALABLE = Symbol(`Value::TYPE_EVALABLE`);
export const TYPE_PRIMITIVE= Symbol(`Value::TYPE_PRIMITIVE`);
export const TYPE_OBJECT= Symbol(`Value::TYPE_PRIMITIVE`);

export class Value<T, V = pickT<T>> extends EventDispatcher {
	public [Ref] = Symbol(`Value::ref`);
	public [Type] = Symbol(`Value::type`);

	public '@change' = new Event<Value<T, V>, [next: pickT<T>, prev: pickT<T>]>(this);
	public '@evaluate' = new Event<Value<T, V>, [value: V, r: pickT<T>]>(this);

	protected _value!: T;
	protected _evaluator?: evaluator<pickT<T>, V>;
	protected _dependencies: Value<any, any>[] = [];

	declare protected _ref: T extends Value<any, any> ? T : never;

	constructor(value: NotValue<T>);
	constructor(value: NotValue<V>, evaluator: evaluator<pickT<T>, NotValue<V>>);
	constructor(value: T, evaluator: evaluator<pickT<T>, NotValue<V>>);
	constructor(value: any, evaluator?: any) {
		super();

		if(evaluator) this._evaluator = evaluator;
		if(value instanceof Value) (this as any)._ref = value;

		this.set(value);
	}

	public get value(): T { return this.get(); }
	public set value(v: NotValue<V>) { this.set(v); }

	public get() { return this._value; }
	public set(value: NotValue<V>): pickT<Value<T, V>> {
		if(!this._evaluator) return this._set(value as pickT<Value<T, V>>);

		const r = this.evaluate(value);
		this._set(r as pickT<T>);

		return r;
	}

	public _set(value: pickT<Value<T, V>>): typeof value {
		const prev = this._value;
		this._value = value;
		this['@change'].emit(value as pickT<T>, prev as pickT<T>);
		return value;
	}

	public evaluate(value: V): pickT<T> {
		if(!this._evaluator) throw new Error('not evaluator');

		const r = this._evaluator.call(null, value);
		this['@evaluate'].emit(value, r);
		return r;
	}

	public addDependencies(...values: Value<any, any>[]): void {
		if(!this._evaluator) throw new Error('not evaluator');

		const deps = this._evaluator[Dependencies] ??= [];

		for(const value of values) {
			value.on('change', value => this.evaluate(value), 0, this[Ref]);
			deps.push(value);
		}
	}

	public destroy(): void {
		for(const dep of this._dependencies) dep.off('change', this[Ref]);
	}

	public override toString() { return this._value; }
	public [Symbol.toPrimitive]() { return this._value; }
}




// export class ValueStr extends EventDispatcher {
// 	public '@change' = new Event<ValueStr, [next: string, prev: string]>(this);
//
// 	protected _dependencies: ValueStr[] = [];
// 	protected _value: string = '';
//
// 	constructor(value: string = '') {
// 		super();
//
// 		this._value = value;
// 	}
//
// 	public get() { return this._value; }
// 	public set(str: TemplateStringsArray, ...values: any[]): string {
// 		const dep = [];
// 		const prev = this._value;
//
// 		for(const v of values) {
// 			if(v === this || !(v instanceof ValueStr) || this._dependencies.includes(v)) continue;
//
// 			const fn = v.on('change', () => {
// 				if(!this._dependencies.includes(v)) v.off('change', fn);
// 				else this._set(str, ...values);
// 			});
//
// 			dep.push(v);
// 		}
//
// 		this._dependencies.length = 0;
// 		this._dependencies.push(...dep);
//
// 		const value = this._set(str, ...values);
// 		this['@change'].emit(value, prev);
//
// 		return value;
// 	}
//
// 	protected _set(str: TemplateStringsArray, ...args: any[]): string {
// 		let acc = str[0];
//
// 		for(let i = 1; i < str.length; i++) {
// 			const a = args[i-1];
//
// 			if(a instanceof ValueStr) acc += a._value;
// 			else acc += String(a);
//
// 			acc += str[i];
// 		}
//
// 		this._value = acc;
//
// 		return acc;
// 	}
//
// 	public toString() { return this._value; }
// 	public [Symbol.toPrimitive]() { return this._value; }
// }
//
//
// const tag = new ValueStr('div');
// const cont = new ValueStr('hello');
// const html = new ValueStr();
//
// html.set`<${tag}>${cont}</${tag}>`;
// console.log(html);
//
// tag.set`nav`;
// console.log(html);
//
// html.set`<>${html}</>`;
// console.log(html);
// html.set`start${cont}end`;
// console.log(html);
