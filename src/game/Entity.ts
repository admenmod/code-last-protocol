import { Vector2 } from 'ver/Vector2';
import { EventDispatcher, FunctionIsEvent } from 'ver/events';
import { math as Math } from 'ver/helpers';

import { direction } from '@/utils/cell';
import { createStateManager } from '@/utils/state-manager';
import { AnyModule, AnyModuleConstructor, AnyModuleId, EntityParams, modules } from '@/modules';


export class Entity<const M extends AnyModuleId[] = []> extends EventDispatcher {
	public isReady: boolean = false;
	public ready = new FunctionIsEvent<Entity<M>, [], () => Promise<boolean>>(this, async () => {
		if(this.isReady) return false;
		this.ready.emit();
		this.isReady = true;
		return true;
	});

	public height: number;
	public size = new Vector2();

	public _direction: direction = 0;
	public get direction() { return this._direction; }
	public set direction(v) { this._direction = Math.mod(v, 0, 8) as direction; }

	public modules: AnyModule[] = [];

	constructor(public cell: Vector2, Modules: M, p: EntityParams<M>) {
		super();

		this.size.set(p.size);
		this.height = p.height;
		this.direction = direction(p.direction);

		for(const id of Modules) this.modules.push(new modules[id](this, p as any));
		for(const module of this.modules) module.ready();

		this.ready();
	}

	public get<T extends M[number]>(module_id: T): InstanceType<typeof modules[T]>;
	public get<T extends keyof typeof modules>(module_id: T): InstanceType<typeof modules[T]> | void;
	public get<T extends AnyModuleConstructor>(Module: T): InstanceType<T> | void;
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
