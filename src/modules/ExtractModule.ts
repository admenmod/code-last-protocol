import { Vector2 } from 'ver/Vector2';
import { Module } from '@/game/Module';
import { APIResult } from '@/code/Executor';
import { dirToVec2, TDiration } from '@/utils/cell';
import { world } from '@/game/world';
import { I } from '@/scenes/WorldMap';
import { CODE } from '@/code/code';
import { Cargo } from '@/utils/cargo';
import { Entity } from '../Entity';


const ID = 'extract';
type ID = typeof ID;

type Iter = Generator<[ID, string, ...any[]], any, any>;

export declare namespace ExtractModule {
	export interface IOwner extends Entity {
		diration: TDiration;
	}
}

type IOwner = ExtractModule.IOwner;


const TIME = 1000;

const ENV = (module: ExtractModule) => ({
	*extract(rpos: Vector2 = dirToVec2(module.owner.diration)): Iter {
		if(!rpos) throw new Error('"extract" invalid argumnets');
		return yield [ID, 'extract', rpos];
	}
});

const API = {
	extract: (module, rpos: Vector2) => ({ time: TIME, task: () => module.extract(rpos) })
} satisfies Record<string, (module: ExtractModule, ...args: any) => APIResult<any>>;

export class ExtractModule extends Module<ID, IOwner> {
	public force: number = 1;

	constructor(owner: IOwner) {
		super(ID, owner, API);
		this.ENV = ENV(this);
	}

	public extract(pos: Vector2) {
		const i = I(pos);
		const resource = world.resources_map[i];

		if(resource <= 0) return CODE.ERR_RESOURCE_NOT_FOUND;

		const items: Cargo.Item[] = [{ title: 'resource', bulk: 1, count: this.force }];
		world.resources_map[i] -= 0.01;

		// world.emit('ResourcesExtract', items);

		return items;
	}
}
