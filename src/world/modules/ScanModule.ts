import { Vector2 } from 'ver/Vector2';
import { EModule } from '../EModule';
import { World } from '@/scenes/World';
import { Unit } from '../unit';
import { APIResult } from '@/code/Executor';


export interface IScanModuleOwner {
	cell: Vector2;
	size: Vector2;
}

type Iter = Generator<[string, ...any[]], any, any>;


const TIME = 1000;

const ENV = (_world: World, _unit: Unit) => ({
	*scan(): Iter { return yield ['scan', 'scan']; }
});

const API = (world: World, unit: Unit) => ({
	scan: () => ({ time: TIME, cache: 'TASK_LAST_LINK', task: () => world.unitRadarScan(unit) })
}) satisfies Record<string, (...args: any) => APIResult<any>>;

export class ScanModule<T extends IScanModuleOwner> extends EModule<T> {
	constructor(world: World, owner: T) {
		super('scan', owner, ENV(world, owner as any as Unit), API(world, owner as any as Unit));
	}
}
