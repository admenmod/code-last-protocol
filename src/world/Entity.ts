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

		for(const module of this.modules) {
			console.log(setInterval(() => console.log(module), 2000));
			module.on('chain', () => console.log(module.module_id, [...module.tasks]));
			module.on('chain', () => (this.processes_state as any)[module.module_id](!!module.tasks.length));
		}
	}

	public processes_state = createStateManager({
		move: false as boolean,
		fire: false as boolean,
		scan: false as boolean,
		work: false as boolean
	}, {
		move: () => true,
		scan: ({ move }) => !move,
		fire: () => true,
		work: ({ move, fire }) => !(move && fire)
	});

	public update(dt: number): void {
		for(let i = 0; i < this.modules.length; i++) {
			if((this.processes_state as any)[this.modules[i].module_id]()) this.modules[i].tick(dt);
		}
	}
}
