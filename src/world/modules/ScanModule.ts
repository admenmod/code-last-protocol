import { Vector2 } from 'ver/Vector2';
import { EModule, type API } from '../EModule';
import { World } from '@/scenes/World';
import { Unit } from '../unit';


export interface IScanModuleOwner {
	cell: Vector2;
	size: Vector2;
}

const TIME = 3000;

const API = (world: World, unit: Unit): API => ({
	scan: () => ({ time: TIME, cache: 'TASK_LAST_LINK', task: () => world.unitRadarScan(unit) })
});

export class ScanModule<T extends IScanModuleOwner> extends EModule<T> {
	constructor(world: World, owner: T) {
		super('scan', owner, API(world, owner as any as Unit));
	}
}
