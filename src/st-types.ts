import { st } from 'ver/super-type';
import { meta, number, object, or, vector2 } from './utils/strc-types';

declare global {
	namespace GlobalSuperTypesRegister {
		interface META {
			type?: string;
			description?: string;
		}
	}
}

export namespace types {
	export type size = st.infer<typeof size>;
	export const size = meta(or(vector2), {
		type: 'size',
		description: 'Size'
	});

	export type direction = st.infer<typeof direction>;
	export const direction = meta((value: any): value is
	|3|2|1
	|4 | 0
	|5|6|7 => typeof value === 'number' && Number.isInteger(value) && !(value < 0 || value > 7), {
		type: 'direction',
		description: 'Direction'
	});

	export type height = st.infer<typeof height>;
	export const height = meta(number.range({ min: 0.001 }), {
		type: 'height',
		description: 'Height'
	});

	export type entity = st.infer<typeof entity>;
	export const entity = meta(object({ size, direction, height }), {
		type: 'entity',
		description: 'Base entity'
	});
}
