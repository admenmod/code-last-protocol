import { Vector2 } from 'ver/Vector2';
import { EModule, type API } from '../EModule';
import { World } from '@/scenes/World';
import { Unit } from '../unit';


export interface IMoveModuleOwner {
	cell: Vector2;
	size: Vector2;
}

const TIME = 1000;

const API = (world: World, unit: Unit) => ({
	turn: (dir: any) => ({ time: TIME, task: () => unit.diration += Math.sign(dir) }),
	moveTo: (pos: Vector2) => ({ time: TIME, task: () => world.moveTo(unit, pos, 1) }),
	moveForward: () => ({ time: TIME, task: () => world.moveForward(unit, 1) })
});

export class MoveModule<T extends IMoveModuleOwner> extends EModule<T> {
	constructor(world: World, owner: T) {
		super('move', owner, API(world, owner as any as Unit));
	}
}
