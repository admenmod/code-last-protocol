import { Vector2 } from 'ver/Vector2';
import { EventDispatcher, FunctionIsEvent } from 'ver/events';
import { math as Math, type object } from 'ver/helpers';

import { direction } from '@/utils/cell';
import { createStateManager } from '@/utils/state-manager';
import { AnyModuleConstructor, AnyModuleId, EntityParams, modules } from '@/modules';
import { types } from '@/st-types';

// NOTE: сделать схемы для модулей более качественными

export class Entity<const T extends AnyModuleId[] = any> extends EventDispatcher {
	public isReady: boolean = false;
	public ready = new FunctionIsEvent<Entity<T>, [], () => Promise<boolean>>(this, async () => {
		if(this.isReady) return false;
		this.ready.emit();
		this.isReady = true;
		return true;
	});

	public height: number;
	public size = new Vector2();

	public _direction: types.direction = 0;
	public get direction() { return this._direction; }
	public set direction(v) { this._direction = Math.mod(v, 0, 8) as types.direction; }

	public modules: object.values<{ [K in keyof T]: T[K] extends keyof typeof modules ? InstanceType<typeof modules[T[K]]> : never }>[] = [];

	constructor(public cell: Vector2, Modules: T, p: EntityParams<T>) {
		super();

		this.size.set(p.size);
		this.height = p.height;
		this.direction = direction(p.direction);

		for(const id of Modules) this.modules.push(new (modules[id] as any)(this, p));
		for(const module of this.modules) module.ready();

		this.ready();
	}

	public get<I extends keyof typeof modules>(module_id: I): InstanceType<typeof modules[I]> | void;
	public get<I extends AnyModuleConstructor>(Module: I): InstanceType<I> | void;
	public get(a: any): any {
		if(typeof a === 'string') return this.modules.find(it => it.id === a);
		else return this.modules.find(it => it instanceof a);
	}

	public state = createStateManager({
		script: () => true,
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
