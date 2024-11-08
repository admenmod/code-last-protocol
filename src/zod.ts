import { z } from 'zod';
import { Vector2 } from 'ver/Vector2';
import { direction } from '@/utils/cell';


type _ = Parameters<typeof z.custom>;

export const z_Vector2 = (...args: [params?: _[1], fatal?: _[2]]) => z.custom<Vector2>(data => data instanceof Vector2, ...args);
export const z_direction = (...args: [params?: _[1], fatal?: _[2]]) => z.custom<direction>(direction.is, ...args);
