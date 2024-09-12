import { Vector2 } from 'ver/Vector2';
import { Event, EventDispatcher } from 'ver/events';
import { math as Math } from 'ver/helpers';

import { TDiration } from '@/utils/cell';
import { EModule } from './EModule';


export class Entity extends EventDispatcher {
	public '@move' = new Event<Entity, [pos: Vector2, prev: Vector2]>(this);

	#prev_cell = new Vector2;
	public readonly cell = new Vector2(0, 0, vec => this['@move'].emit(vec.new(), this.#prev_cell.new()));
	public readonly size = new Vector2(1, 1);

	public _diration: TDiration = 0;
	public get diration() { return this._diration; }
	public set diration(v) { this._diration = Math.mod(v, 0, 8) as TDiration; }

	public modules: EModule<Entity>[] = [];

	constructor(cell: Vector2, modules: (new (owner: Entity) => EModule<Entity>)[]) { super();
		this.cell.set(cell);

		for(const module of modules) this.modules.push(new module(this));
	}
}
