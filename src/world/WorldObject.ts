import { Vector2 } from 'ver/Vector2';
import { Event, EventDispatcher } from 'ver/events';


export class WorldObject extends EventDispatcher {
	public '@move' = new Event<WorldObject, [pos: Vector2, prev: Vector2]>(this);

	#prev_cell = new Vector2;
	public readonly cell = new Vector2(0, 0, vec => this['@move'].emit(vec.new(), this.#prev_cell.new()));
	public readonly size = new Vector2(1, 1);

	constructor(cell: Vector2) { super();
		this.cell.set(cell);
	}
}
