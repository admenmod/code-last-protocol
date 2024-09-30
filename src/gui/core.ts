import 'mol_wire_lib';
import type { $mol_mem as _$mol_mem } from 'mol_wire_lib';

declare global {
	var $mol_mem: typeof _$mol_mem;
}


export const UPDATE = Symbol('UPDATE');

export const react: MethodDecorator = (target, key) => {
	if(typeof key === 'symbol') throw new Error('key symbol');

	const f = (target as any)[key] as (...args: any) => any;

	const moke = {};
	Object.defineProperty(moke, key, Object.assign(Object.getOwnPropertyDescriptor(target, key)!, {
		value: function(this: any, next: any) { this[UPDATE]?.(key, next); return f.call(this, next); }
	}));

	$mol_mem(moke, key);

	(target as any)[key] = (moke as any)[key];

	return (moke as any)[key];
};
