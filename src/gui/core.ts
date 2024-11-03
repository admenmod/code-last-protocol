import 'mol_wire_lib';
import type { $mol_mem as _$mol_mem } from 'mol_wire_lib';

declare global {
	var $mol_mem: typeof _$mol_mem;
}


export const UPDATE = Symbol('UPDATE');

export const react: MethodDecorator = (target: any, key) => {
	if(typeof key === 'symbol') throw new Error('key symbol');

	const f = target[key];

	target[key] = function(this: any, next: any) { this[UPDATE]?.(key, next); return f.call(this, next); }

	return $mol_mem(target, key);
};
