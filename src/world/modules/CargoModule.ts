import { Vector2 } from 'ver/Vector2';
import { EModule } from '../EModule';
import { World } from '@/scenes/World';
import { Unit } from '../unit';
import { APIResult } from '@/code/Executor';


export interface ICargoModuleOwner {
	cell: Vector2;
	size: Vector2;
}

type Iter = Generator<['cargo', string, ...any[]], any, any>;


const TIME = 1000;

const ENV = (_world: World, unit: Unit) => ({
	get cargo_filled() { return unit.cargo.fullness_normaloze > 0.9; },
	*transfer(target?: Vector2): Iter {
		if(!target) throw new Error('"transfer" invalid argumnets '+String(target));
		return yield ['cargo', 'transfer', target.new()];
	}
});

const API = (world: World, unit: Unit) => ({
	transfer: (target: Vector2) => {
		return { time: TIME, task: () => world.transfer(unit, target) };
	}
}) satisfies Record<string, (...args: any) => APIResult<any>>;

export class CargoModule<T extends ICargoModuleOwner> extends EModule<T> {
	constructor(world: World, owner: T) {
		super('cargo', owner, ENV(world, owner as any as Unit), API(world, owner as any as Unit));
	}
}
