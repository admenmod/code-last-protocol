import { Vector2_t } from 'ver/Vector2';


export interface BuildingScheme {
	time: number;
	pos: Vector2_t;
	size: Vector2_t;
	groups: string[];
	blueprint_id: string;
}
