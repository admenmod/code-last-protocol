import { Vector2 } from 'ver/Vector2';
import { Event, EventDispatcher } from 'ver/events';
import { math as Math } from 'ver/helpers';

import { TDiration } from '@/utils/cell';
import { EModule } from './EModule';
import { World } from '@/scenes/World';
import { createStateManager } from '@/utils/state-manager';


export class Entity extends EventDispatcher {
	public '@move' = new Event<Entity, [pos: Vector2, prev: Vector2]>(this);

	#prev_cell = new Vector2;
	public readonly cell = new Vector2(0, 0, vec => this['@move'].emit(vec.new(), this.#prev_cell.new()));
	public readonly size = new Vector2(1, 1);

	public _diration: TDiration = 0;
	public get diration() { return this._diration; }
	public set diration(v) { this._diration = Math.mod(v, 0, 8) as TDiration; }

	public modules: EModule<Entity>[] = [];

	constructor(cell: Vector2, world: World, modules: (new (world: World, owner: Entity) => EModule<Entity>)[]) { super();
		this.cell.set(cell);

		for(const module of modules) this.modules.push(new module(world, this));
	}

	public processes_state = createStateManager({
		move: () => true,
		scan: ({ move }) => !move,
		fire: () => true,
		work: ({ move, fire }) => !(move && fire)
	});

	public update(dt: number): void {
		for(let i = 0; i < this.modules.length; i++) {
			const module = this.modules[i];
			if((this.processes_state as any)[module.module_id](!!module.tasks.length)) module.tick(dt);
		}
	}
}
