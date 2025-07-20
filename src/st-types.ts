import { st } from 'ver/super-type';
import { meta, number, object, or, vector2 } from './utils/strc-types';


export namespace GST {
	export interface META {
		type: any;
		description: string;
	}

	export const size = meta(or(vector2), {
		type: 'size',
		description: 'Size'
	} satisfies META);

	export type direction = st.infer<typeof GST.direction>;
	export const direction = meta((value: any): value is
	|3|2|1
	|4 | 0
	|5|6|7 => typeof value === 'number' && Number.isInteger(value) && !(value < 0 || value > 7), {
		type: 'direction',
		description: 'Direction'
	} satisfies META);

	export const height = meta(number.range({ min: 0.001 }), {
		type: 'height',
		description: 'Height'
	} satisfies META);

	export const entity = meta(object({ size, direction, height }), {
		type: 'entity',
		description: 'Base entity'
	} satisfies META);
}
