import { Vector2 } from 'ver/Vector2';


export type TDiration =
	|1|2|3
	|0 | 4
	|7|6|5

export const dirToVec2 = (dir: TDiration) => {
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


