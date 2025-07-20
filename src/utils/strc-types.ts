import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import { Err, type object as _object, type list } from 'ver/helpers';
import { ID, st } from 'ver/super-type';


export type Include<T> = { [ID]: 'Include', T: T };
export type Cont<T> = { [ID]: 'Cont', T: T };

type _toArray<T extends Include<any>> = T extends Include<infer _> ? _[] : never;
type _toCont<T extends Cont<any>> = T extends Cont<infer _> ? { Cont: _ } : never;

declare global {
	interface SuperTypesRegister<T extends any[] = any> {
		and: {
			Include(): Include<list.OR<{ [K in keyof T]:
				T[K] extends { [ID]: 'Include' } ? T[K]['T'] :
				Err<['and::Include error type', T[K]]>; }>>;

			Cont(): Cont<list.AND<{ [K in keyof T]:
				T[K] extends { [ID]: 'Cont' } ? T[K]['T'] :
				Err<['and::Cont error type', T[K]]>; }>>;
		},
		or: {
			Include(): list.OR<{ [K in keyof T]:
				T[K] extends { [ID]: 'Include' } ? Include<T[K]['T']> :
				Err<['or::Include error type', T[K]]>; }>;

			Cont(): list.OR<{ [K in keyof T]:
				T[K] extends { [ID]: 'Cont' } ? Cont<T[K]['T']> :
				Err<['or::Cont error type', T[K]]>; }>;
		},
		resolve: {
			Include(): { [K in keyof T]: T[K] extends { [ID]: 'Include' } ?
				_toArray<T[K]> :
				Err<['resolve::Include error type', T[K]]>; };

			Cont(): { [K in keyof T]: T[K] extends { [ID]: 'Cont' } ?
				_toCont<T[K]> :
				Err<['resolve::Cont error type', T[K]]>; };
		}
	}
}

export const meta = st.meta;

export const or = <const T extends any[]>(...args: T) => (data: any): data is st.OpSTArgs<'or', {
	[K in keyof T]: T[K] extends st.TypeGuard ? st.TypeGuard.T<T[K]> : T[K];
}> => st.or(...[new Set(args)].map(it => lit(it))) as any;

export const and = <const T extends any[]>(...args: T) => (data: any): data is st.OpSTArgs<'and', {
	[K in keyof T]: T[K] extends st.TypeGuard ? st.TypeGuard.T<T[K]> : T[K];
}> => st.and(...[new Set(args)].map(it => lit(it))) as any;


export const number = Object.assign(st.meta(v => typeof v === 'number', {
	type: 'number', description: 'is number'
}), {
	range: ({ min, max }: {
		min?: number, max?: number
	}) => st.meta(st.and(number, (v): v is number => v >= (min || -Math.INF) && v <= (max || Math.INF)), {
		type: 'number::range', description: 'is range'
	})
});
export const string = st.meta(v => typeof v === 'string', { type: 'string', description: 'is string' });

export const vector2 = st.meta((v): v is Vector2 => v instanceof Vector2, {
	type: Vector2,
	description: 'is Vector2'
});


export type RecordModel = { [K: PropertyKey]: RecordModel | /* ArrayModel |*/ st.TypeGuard | st.Ref; };

export const object = <T extends RecordModel>(o: T) => {
	// const res = (o: RecordModel | _object.values<RecordModel>, key?: sm.path[number]) => {
	// 	const path: sm.path = [];
	//
	// 	if(o instanceof sm.Type) points.push([path, o]);
	// 	else if(REF in o) {
	// 		o.scope[o.id];
	// 		throw new Error('not implemented');
	// 	} else if(o instanceof sm.Model) {
	// 		// WARN: не учитываются tgs модели
	// 		for(const [p, t] of o.points) points.push([[...path, ...p], t]);
	// 	} else if(typeof o === 'object') {
	// 		if(typeof key !== 'undefined') path.push(key);
	//
	// 		for(const key in o) res(o[key], key);
	//
	// 		if(typeof key !== 'undefined') path.pop();
	// 	} else {
	// 		if(sm.isRegisteredType(o)) throw new Error('not implemented');
	// 		throw new Error('unknown type');
	// 	}
	// };

	// res(o);

	const parse = (data: any): data is st.infer<T> => {
		if(data !== null && typeof data === 'object') throw new Error('is object');

		// for(const [path, type] of points) {
		// 	// HACK:
		// 	if(!type.parse(eval(`data.${path.join('.')}`))) return false;
		// }

		return true;
	};

	return st.meta(parse, {});
};


/*
export type ArrayModel = (RecordModel | ArrayModel | sm.Type | sm.Model | sm.Ref)[];

export const array = <const Name, const T extends (RecordModel | sm.Type | sm.Model | sm.Ref) | ArrayModel, const Tgs extends sm.ITypeArg[]>(name: Name, o: T, ...tgs: Tgs) => {
	// const _tgs = tgs.map(it => it instanceof Type ? it.tgs : it) as Default<ITypeArgsToTGS<Tgs>, []>;
	const points: sm.Point[] = [];

	if(!Array.isArray(o)) {
		const path = ['number'];

		if(o instanceof sm.Type) points.push([
			path, sm.type('array<T>', ['is array<T>', (v: any[]): v is sm.infer<T>[] => v.every(it => o.parse(it))])
		]); else if(o instanceof sm.Model) {
			for(const [p, t] of o.points) points.push([[...path, ...p], t]);
		// } else if(o === SELF) {
		// 	// BUG:
			// throw new Error('not implemented');
		} else {
			// HACK:
			if(sm.isRegisteredType(o)) throw new Error('not implemented');
		}
	} else {
		let i = 0;
		for(const v of o) {
			if(v instanceof sm.Type) points.push([[i], v]);
			else if(v instanceof sm.Model) {
				for(const [p, t] of v.points) points.push([[i, ...p], t]);
			// } else if(v === SELF) {
			// 	// BUG:
				// throw new Error('not implemented');
			} else {

				// HACK:
				if(sm.isRegisteredType(v)) throw new Error('not implemented');
			}
		}
	}


	return new sm.Model(`array::<${name}>`, o, points, (data): data is sm.infer<T extends ArrayModel ? T : T[]> => {
		for(const [path, type] of points) {
			// HACK:
			if(!type.parse(eval(`data[path[0]]`))) return false;
		}

		return true;
	}, ['is array', (v: any): v is unknown[] => Array.isArray(v)], ...sm.toITypes(tgs));
};
*/

const lit = <T>(v: T) => (data: any): data is T => data === v;

let t1 = st.or(lit({ a: 1 }), lit({ b: 2 }));
let t2 = st.or(lit({ c: 3 }), lit({ f: 4 }));
let test_type = st.and(t1, t2);

// let test_type = sm.or(string, number);

// let a: sm.TypeGuard.resolve<typeof test_type> = {};

{
	let d: any = 0 as any;

	if(st.parse(test_type, d)) {
		let a = d;
		// a = 'ksd';
	}
}
