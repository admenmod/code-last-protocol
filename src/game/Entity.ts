import { Vector2 } from 'ver/Vector2';
import { Event, EventDispatcher } from 'ver/events';
import { math as Math, object as Object } from 'ver/helpers';

import { TDiration } from '@/utils/cell';
import { Module } from '@/modules/Module';
import { createStateManager } from '@/utils/state-manager';
import { modules_env } from '@/modules';


export class Entity extends EventDispatcher {
	public _diration: TDiration = 0;
	public get diration() { return this._diration; }
	public set diration(v) { this._diration = Math.mod(v, 0, 8) as TDiration; }

	public modules: Module<string, Entity>[] = [];
	public ENV: Record<string, any> = Object.create(null);

	constructor(
		public cell: Vector2,
		public size: Vector2,
		public height: number,
		diration: TDiration,
		Modules: (new (owner: Entity) => Module<string, Entity>)[]
	) {
		super();

		this.diration = diration;

		for(const Module of Modules) this.modules.push(new Module(this));
		for(const module of this.modules) Object.fullassign(this.ENV, modules_env[module.id as keyof typeof modules_env](module as any));
	}

	public state = createStateManager({
		move: () => true,
		scan: ({ move }) => !move,
		fire: () => true,
		cargo: ({ move }) => !move,
		extract: ({ move, fire }) => !(move && fire)
	});

	public update(dt: number): void {
		for(let i = 0; i < this.modules.length; i++) {
			const module = this.modules[i];
			if((this.state as any)[module.id](!!module.tasks.length)) module.tick(dt);
		}
	}
}
