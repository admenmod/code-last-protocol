import { Vector2 } from 'ver/Vector2';
import { EModule } from '../EModule';
import { World } from '@/scenes/World';
import { Unit } from '../unit';
import { APIResult } from '@/code/Executor';
import { dirToVec2 } from '@/utils/cell';


export interface IExtractModuleOwner {
	cell: Vector2;
	size: Vector2;
}

type Iter = Generator<['extract', string, ...any[]], any, any>;


const TIME = 1000;

const ENV = (_world: World, unit: Unit) => ({
	*extract(rpos: Vector2 = dirToVec2(unit.diration)): Iter {
		if(!rpos) throw new Error('"extract" invalid argumnets');
		return yield ['extract', 'extract', rpos];
	}
});

const API = (world: World, unit: Unit) => ({
	extract: (rpos: Vector2) => ({ time: TIME, task: () => world.unitExtract(unit, rpos) })
}) satisfies Record<string, (...args: any) => APIResult<any>>;

export class ExtractModule<T extends IExtractModuleOwner> extends EModule<T> {
	constructor(world: World, owner: T) {
		super('extract', owner, ENV(world, owner as any as Unit), API(world, owner as any as Unit));
	}
}
