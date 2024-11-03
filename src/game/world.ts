import { Vector2 } from 'ver/Vector2';
import { Event, EventDispatcher } from 'ver/events';
import { Parameters } from 'ver/helpers';

import { I } from '@/scenes/WorldMap';
import type { IScanData } from '@/game/types';
import type { Entity } from '@/game/Entity';
import { Env } from '@/game/Env';
import { modules } from '@/modules';


export const world = new class World extends EventDispatcher {
	public '@insert' = new Event<World, [o: Entity]>(this);
	public '@remove' = new Event<World, [o: Entity]>(this);

	public '@create' = new Event<World, [o: Entity]>(this);
	public '@delete' = new Event<World, [o: Entity]>(this);


	public entitys: Entity[] = [];

	public height_map: number[] = [];
	public resources_map: number[] = [];

	public insert<T extends Entity>(o: T): T {
		this.entitys.push(o);
		this['@insert'].emit(o);
		return o;
	}
	public remove<T extends Entity>(o: T): T | void {
		const l = this.entitys.indexOf(o);

		if(~l) {
			this['@remove'].emit(o);
			return this.entitys.splice(l, 1)[0] as T;
		}
	}

	public create<T extends new (...args: any) => Entity>(Class: T, cell: Vector2, ...args: Parameters<T>): InstanceType<T> {
		const o = new Class(...args);
		o.cell.set(cell);

		this.entitys.push(o);
		this['@create'].emit(o);
		this.insert(o);

		return o as InstanceType<T>;
	}
	public delete<T extends Entity>(o: T): T | void {
		const l = this.entitys.indexOf(o);

		if(~l) {
			this['@delete'].emit(o);
			this.remove(o);
			return this.entitys.splice(l, 1)[0] as T;
		}
	}

	public communication_network = new Env.CommunicationNetwork();
	public electrical_network = new Env.ElectricalNetwork();
	public radar_scan_data = new WeakMap<Entity, IScanData>();

	public getObjectHeight(obj: Entity) { return this.height_map[I(obj.cell)]+obj.height; }


	async #init(this: World): Promise<void> {
		modules.cargo;
	}


	constructor() { super(); this.#init(); }
}
