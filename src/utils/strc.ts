import { constructor_chain, throwError, type object, type calc, type Default, type list, type PushArrIfNotNever, Err } from 'ver/helpers';


export namespace sm {
	export type AnyST = { [ID]: any };

	export type TG<T = any> = (data: any) => data is T; // type guard
	declare namespace TG { type T<T extends TG> = T extends TG<infer R> ? R : never; }

	// export type ITypeArrToST<T extends IType[]> = { [K in keyof T]: ToST<TG.T<T[K][1]>>; };
	// export type TypeToST<T extends Type> = ResolveTypeArgs<ITypeArrToST<Type.T<T>>>;


	export type IType = [string, TG];
	export type ITypeArg = IType | Type;

	export declare namespace Type {
		export type T<T> = T extends Type<any, infer R> ? R : Err<['is not Type', T]>;
		export type Token<T> = T extends Type<infer R, any> ? R : Err<['is not Type', T]>;
	}
	export class Type<const Token = any, const T extends IType[] = IType[]> {
		public tgs: T;

		constructor(public token: Token, ...tgs: T) {
			this.tgs = tgs;
		}

		public parse(data: unknown): data is ResolveTypeArgs<inferTfromIType<T>> {
			try {
				for(const tg of this.tgs) if(!tg[1](data)) throw tg[0];
				return true;
			} catch(err) {
				throw err;
			}
		}
	}

	export type ITypeArgsToTGS<T extends ITypeArg[]> = list.flat<{ [K in keyof T]: T[K] extends Type ? Type.T<T[K]> : [T[K]]; }>;
	export const toITypes = <T extends ITypeArg[]>(tgs: T) => tgs.map(it => it instanceof Type ? it.tgs : it) as Default<ITypeArgsToTGS<T>, []>;


	export const type = <const Token, const T extends ITypeArg[]>(token: Token, ...tgs: T) => {
		const _tgs = tgs.map(it => it instanceof Type ? it.tgs : it) as ITypeArgsToTGS<T>;
		return new Type(token, ..._tgs);
	};


	export type path = PropertyKey[];
	export type Point<P extends path = path, T extends Type = Type> = [path: P, type: T];

	export declare namespace Model {
		export type Token<T> = T extends Model<infer R> ? R : Err<['is not Model']>;
		export type T<T> = T extends Model<any, infer R> ? R : Err<['is not Model']>;
		export type R<T> = T extends Model<any, any, infer R> ? R : Err<['is not Model']>;
		export type ITypes<T> = T extends Model<any, any, any, infer R extends any[]> ? R : Err<['is not Model']>;
		// export type Type<T extends Model> = ResolveTypeArgs<inferTfromIType<Model.ITypes<T>>> & Model.T<T>;
	}
	export class Model<const Token = any, const T = any, const R = any, const ITypes extends IType[] = IType[]> {
		public tgs: ITypes;

		constructor(
			public token: Token,
			public T: T,
			public points: Point[],
			protected _parse: (data: unknown) => data is R,
			...tgs: ITypes
		) { this.tgs = tgs; }

		public parse(data: unknown): data is Default<ResolveTypeArgs<inferTfromIType<ITypes>>, unknown> & R {
			try {
				return this.tgs.every(it => it[1](data) || throwError(new Error(it[0]))) && this._parse(data);
			} catch(err) {
				throw err;
			}
		}
	}


	export const isRegisteredType = (v: any): boolean => !Object.getPrototypeOf(v) || [...constructor_chain(v)].every(it => it === Object);


	const REF = Symbol('SuperType<REF>');
	type REF = typeof REF;

	export const Ref = <T extends (...args: any) => any, K extends keyof ReturnType<T>>(scope: T, id: K): Ref<T, K> => ({ scope, id, [REF]: REF });
	export type Ref<T extends (...args: any) => any = any, K extends keyof ReturnType<T> = any> = { scope: T, id: K, [REF]: REF };


	export type ResolveObject<T> = { [K in keyof T]: Resolve<T[K]>; };

	export type inferTfromIType<T extends IType[]> = { [K in keyof T]: TG.T<T[K][1]>; };

	export type Resolve<T> =
		T extends Ref ? Resolve<ReturnType<T['scope']>[T['id']]> :
		T extends Type ? ResolveTypeArgs<inferTfromIType<Type.T<T>>> :
		T extends Model ? ResolveTypeArgs<inferTfromIType<Model.ITypes<T>>> & ResolveObject<Model.T<T>> :
		T extends IType[] ? ResolveTypeArgs<inferTfromIType<T>> :
		T extends IType ? ResolveTypeArgs<inferTfromIType<[T]>> :
		T extends object ? ResolveObject<T> :
		T;
		// Err<['sm::Resolve', 'Unknown type', T]>;

	export type infer<T> = Resolve<T>;
}



{
	let o = { Omodel: 'O' };
	let points: sm.Point[] = [
		// [['ss'], type('test-type', ['test', (v): v is { test_type: 'test type' } => true])]
	];

	let aa = new sm.Model('test', o, points, (data): data is unknown => !!data);


	let data: any = 0;

	if(aa.parse(data)) {
		data;
	}
}

export type ID = typeof ID;
export const ID = Symbol('ID');

type Include<T> = { [ID]: 'Include', T: T };
type Cont<T> = { [ID]: 'Cont', T: T };

type _ReturnType<T> = T extends (...args: any) => any ? ReturnType<T> : Err<['ReturnType error', T]>;
export type OP<op extends keyof SuperTypesRegister, T extends any[], id> =
	id extends keyof SuperTypesRegister[op] ? _ReturnType<SuperTypesRegister<T>[op][id]> : Err<[`${op}<id> is not found`, id]>;


type toTYPE<T, D = T> = T extends { [ID]: infer R } ? R : D;

type PushToSet<Acc extends any[], T> = [T] extends [never] ? Acc : T extends Acc[number] ? Acc : [...Acc, T];

type getTypes<T extends any[], Acc extends any[] = []> = T extends [infer v, ...infer __] ? getTypes<__, PushToSet<Acc, toTYPE<v, never>>> : Acc;
let getTypes: getTypes<args>;

// type ResolveUnknownType<T extends any[], id> =
// 	and<T, id> extends Err<any> ? and<T, id> :
// 	res<[and<T, id>], id> extends Err<any> ? res<[and<T, id>], id> :
// 	res<[and<T, id>], id>[0];

type MergeSTArgs<T extends any[], Acc extends any[] = [], Ids extends any[] = getTypes<T>> =
	Ids extends [infer id, ...infer __] ? MergeSTArgs<
		list.splitByCondition<T, { [ID]: id }>[1],
		[...Acc, OP<'and', list.splitByCondition<T, { [ID]: id }>[0], id>],
	__> : [...Acc, ...T];

type _ResolveTypeArgs<T extends any[]> = { [K in keyof T]: T[K] extends { [ID]: infer id } ? OP<'resolve', [T[K]], id>[0] : T[K]; };
//@ts-expect-error
export type ResolveTypeArgs<T extends any[]> = list.AND<_ResolveTypeArgs<MergeSTArgs<T>>>;


type args = [Include<'move'>, Include<'cargo'>, Cont<{ k: 'jsw' }>, Cont<{ a: 92 }>, { ajjsnxnsm: 939283828 }];

let resolved: ResolveTypeArgs<args>;
