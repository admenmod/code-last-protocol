import { z } from 'zod';
import { Vector2 } from 'ver/Vector2';
import { direction } from '@/utils/cell';


type _ = Parameters<typeof z.custom>;

const zVector2 = (...args: [params?: _[1], fatal?: _[2]]) => z.custom<Vector2>(data => data instanceof Vector2, ...args);
const zDirection = (...args: [params?: _[1], fatal?: _[2]]) => z.custom<direction>(direction.is, ...args);

z.Vector2 = zVector2;
z.direction = zDirection;

declare module 'zod' {
	namespace z {
		let Vector2: typeof zVector2;
		let direction: typeof zDirection;
	}
}
