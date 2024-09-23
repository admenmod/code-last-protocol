import { Vector2 } from 'ver/Vector2';
import { Event, EventDispatcher } from 'ver/events';
import { math as Math, object as Object } from 'ver/helpers';

import { TDiration } from '@/utils/cell';
import { EModule } from './EModule';
import { World } from '@/scenes/World';
import { createStateManager } from '@/utils/state-manager';
import { type Cargo } from './cargo';


export class Entity extends EventDispatcher {
	public static build_resources: Cargo.Item[] = [{ title: 'A', bulk: 1, count: 1 }];


	public '@move' = new Event<Entity, [pos: Vector2, prev: Vector2]>(this);

	#prev_cell = new Vector2;
	public readonly cell = new Vector2(0, 0, vec => this['@move'].emit(vec.new(), this.#prev_cell.new()));
	public readonly size = new Vector2(1, 1);

	public _diration: TDiration = 0;
	public get diration() { return this._diration; }
	public set diration(v) { this._diration = Math.mod(v, 0, 8) as TDiration; }

	public modules: EModule<Entity>[] = [];
	public ENV: Record<string, any> = Object.create(null);

	constructor(cell: Vector2, world: World, Modules: (new (world: World, owner: Entity) => EModule<Entity>)[]) { super();
		this.cell.set(cell);

		for(const module of Modules) this.modules.push(new module(world, this));
		for(const module of this.modules) Object.fullassign(this.ENV, module.ENV);
	}

	public processes_state = createStateManager({
		move: () => true,
		scan: ({ move }) => !move,
		fire: () => true,
		cargo: ({ move }) => !move,
		extract: ({ move, fire }) => !(move && fire)
	});

	public update(dt: number): void {
		for(let i = 0; i < this.modules.length; i++) {
			const module = this.modules[i];
			if((this.processes_state as any)[module.module_id](!!module.tasks.length)) module.tick(dt);
		}
	}
}
