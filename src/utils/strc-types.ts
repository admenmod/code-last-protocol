import { Vector2 } from 'ver/Vector2';
import { Err, type object as _object, type list } from 'ver/helpers';
import { ID, sm } from './strc';


export type NumberArrayToUnionString<T extends number[]> = _NumberArrayToUnionString<list.tail<T>, `${list.head<T>}`>;
export type _NumberArrayToUnionString<T extends number[], Acc extends string> =
	T extends [infer R extends string] ? `${Acc} | ${R}` : _NumberArrayToUnionString<list.tail<T>, `${Acc} | ${list.head<T>}`>;

export const number = Object.assign(sm.type('number', ['is number', v => typeof v === 'number']), {
	as: <const T extends number[]>(...T: T) => {
		const t = T.join(' | ') as NumberArrayToUnionString<T>;
		return sm.type(`number::is<${t}>`, number, [`is ${T}`, (v): v is T[number] => T.includes(v)]);
	}
});

export type StringArrayToUnionString<T extends string[]> = _StringToUnionString<list.tail<T>, `'${list.head<T>}'`>;
export type _StringToUnionString<T extends string[], Acc extends string> =
	T extends [infer R extends string] ? `${Acc} | '${R}'` : _StringToUnionString<list.tail<T>, `${Acc} | '${list.head<T>}'`>;

export const string = Object.assign(sm.type('string', ['is string', v => typeof v === 'string']), {
	as: <const T extends string[]>(...T: T) => {
		const t = T.map(it => `'${it.replace("'", "\\'")}'`).join(' | ') as StringArrayToUnionString<T>;
		return sm.type(`string::is<${t}>`, string, [`is ${t}`, (v): v is T[number] => T.includes(v)]);
	}
});


export type RecordModel = { [K: PropertyKey]: RecordModel | sm.Type | sm.Model | sm.Ref; };

export const object = <const Name, T extends RecordModel, Tgs extends sm.ITypeArg[]>(name: Name, o: T, ...tgs: Tgs) => {
	const points: sm.Point[] = [];

	for(const k in o) {
		const v = o[k];

		points.push([[k], sm.type(`[${k}] in object`, [
			`[${k}] in object`, <const k extends PropertyKey>(v: any): v is { [K in k]: unknown } => v[k]])
		]);

		if(v instanceof sm.Type) points.push([[k], v]);
		else if(v instanceof sm.Model) {
			for(const [p, t] of v.points) points.push([[k, ...p], t]);
		// } else if(v === SELF) {
		// 	// BUG: throw new Error('not implemented');
		} else {
			// HACK:
			if(sm.isRegisteredType(v)) throw new Error('not implemented');
		}
	}

	const parse = (data: any): data is sm.infer<T> => {
		for(const [path, type] of points) {
			// HACK:
			if(!type.parse(eval(`data.${path.join('.')}`))) return false;
		}

		return true;
	};

	const is_object = ['is object', (v: any): v is object => v !== null && typeof v === 'object'] satisfies sm.IType;

	return new sm.Model(`object::<${name}>`, o, points, parse, is_object, ...sm.toITypes(tgs));
};


export type ArrayModel = (RecordModel | sm.Type | sm.Model | sm.Ref)[];

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


export const vector2 = sm.type(Vector2, ['is Vector2', (v): v is Vector2 => v instanceof Vector2]);


export type Include<T> = { [ID]: 'Include', T: T };
export type Cont<T> = { [ID]: 'Cont', T: T };

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
				Array<T[K]['T']> :
				Err<['resolve::Include error type', T[K]]>; };

			Cont(): { [K in keyof T]: T[K] extends { [ID]: 'Cont' } ?
				{ Cont: T[K]['T'] } :
				Err<['resolve::Cont error type', T[K]]>; };
		}
	}
}
