import { AnyModuleId, IEntityParams, modules } from '@/modules';
import { Vector2 } from 'ver/Vector2';


export type IScanData = {
	time: number;
	pos: Vector2;
	cell: Record<string, number>;
	units: { type: string; }[];
	structures: { type: string; }[];
}[];

export type IBlueprint<T extends AnyModuleId[] = AnyModuleId[]> = {
	name?: string;
	time: number;
	modules: T;
	params: EntityParams<T>;
};
