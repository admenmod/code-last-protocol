import { Vector2 } from 'ver/Vector2';
import { EModule } from '../EModule';


export interface IMoveModuleOwner {
	cell: Vector2;
	size: Vector2;
}


export class MoveModule<T extends IMoveModuleOwner> extends EModule<T> {
	constructor(owner: T) {
		super('move', owner);
	}
}
