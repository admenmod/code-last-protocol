import { Vector2 } from 'ver/Vector2';


export type direction =
	|3|2|1
	|4 | 0
	|5|6|7;

export const direction = (value?: any): direction => (Number(value ?? 0) % 7) as direction;
direction.is = (value: any): value is direction => typeof value === 'number' && Number.isInteger(value) && !(value < 0 || value > 7);

export const dirToVec2 = (dir: direction) => {
	if(dir === 0) return new Vector2(-1,  0);
	if(dir === 1) return new Vector2(-1, -1);
	if(dir === 2) return new Vector2( 0, -1);
	if(dir === 3) return new Vector2(+1, -1);
	if(dir === 4) return new Vector2(+1,  0);
	if(dir === 5) return new Vector2(+1, +1);
	if(dir === 6) return new Vector2( 0, +1);
	if(dir === 7) return new Vector2(-1, +1);

	throw new Error();
};
