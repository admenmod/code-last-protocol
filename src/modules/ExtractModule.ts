import { Vector2 } from 'ver/Vector2';
import { Module } from '@/modules/Module';
import { APIResult } from '@/code/Executor';
import { dirToVec2 } from '@/utils/cell';
import { I, world } from '@/game/world';
import { CODE } from '@/code/code';
import { Cargo } from '@/utils/cargo';
import { Entity } from '@/game/Entity';
import { EntityParams, mod_env, mod_st, modules } from '@/modules';
import { number, object } from '@/utils/strc-types';


const ID = 'extract';
type ID = typeof ID;

type Iter = Generator<[ID, string, ...any[]], any, any>;

export declare namespace ExtractModule {
	export interface IOwner extends Entity<[ID]> {}
}
type IOwner = ExtractModule.IOwner;

const st_model = object({
	[ID]: {
		force: number.range({ min: 1 })
	}
});


const TIME = 1000;

const ENV = (module: ExtractModule) => ({
	*extract(rpos: Vector2 = dirToVec2(module.owner.direction)): Iter {
		if(!rpos) throw new Error('"extract" invalid argumnets');
		return yield [ID, 'extract', rpos];
	}
});

const API = {
	extract: (module, rpos: Vector2) => ({ time: TIME, task: () => module.extract(rpos) })
} satisfies Record<string, (module: ExtractModule, ...args: any) => APIResult<any>>;

export class ExtractModule extends Module<ID, IOwner> {
	public force: number;

	constructor(owner: IOwner, { extract }: EntityParams<[ID]>) {
		super(ID, owner, API);

		this.force = extract.force || 1;
	}

	public extract(rpos: Vector2 = Vector2.ZERO) {
		const pos = this.owner.cell.new().add(rpos);
		const i = I(pos);
		const resource = world.resources_map[i];

		if(resource <= 0) return CODE.ERR_RESOURCE_NOT_FOUND;

		// HACK:
		const items: Cargo.Item[] = [{ title: 'resource', bulk: 1, count: this.force }];
		world.resources_map[i] -= 0.01;

		// world.emit('ResourcesExtract', items);

		return items;
	}
}


mod_env[ID] = ENV;
mod_st[ID] = st_model;
modules[ID] = ExtractModule;

declare module '@/modules' {
	namespace mod_env { let extract: typeof ENV; }
	namespace mod_st { let extract: typeof st_model; }
	namespace modules { let extract: typeof ExtractModule; }
}
