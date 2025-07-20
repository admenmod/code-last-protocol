import { Vector2 } from 'ver/Vector2';
import { Module } from '@/modules/Module';
import { APIResult } from '@/code/Executor';
import { I, world } from '@/game/world';
import { CODE, isError } from '@/code/code';
import { Entity } from '@/game/Entity';
import { mod_env, mod_st, modules } from '@/modules';
import { IBlueprint } from '@/game/types';
import { codenv } from '@/codenv';
import { object } from '@/utils/strc-types';


const ID = 'build';
type ID = typeof ID;

type Iter = Generator<[ID, string, ...any[]], any, any>;

export declare namespace BuildModule {
	export interface IOwner extends Entity<[ID]> {}
}
type IOwner = BuildModule.IOwner;

const st_model = object({});


const TIME = 1000;

const ENV = (_module: BuildModule) => ({
	*build(blueprint: IBlueprint | string): Iter {
		return yield [ID, 'build', blueprint];
	}
});

const API = {
	build: (module, blueprint: IBlueprint, rpos: Vector2) => ({ time: TIME, task: () => module.spawn(blueprint, rpos) })
} satisfies Record<string, (module: BuildModule, ...args: any) => APIResult<any>>;

export class BuildModule extends Module<ID, IOwner> {
	constructor(owner: IOwner) {
		super(ID, owner, API);

		this.ready.once(() => {
			if(!this.owner.get('cargo')) throw new Error('build module require cargo module');
		})
	}

	public canSpawn(blueprint: IBlueprint, rpos: Vector2 = Vector2.ZERO) {
		const bp = typeof blueprint === 'string' ? codenv.blueprints[blueprint] : blueprint;

		if(rpos.isSame(Vector2.ZERO)) return CODE.TARGET_DISTANCE_ZERO;
		if(Math.abs(rpos.x) > 1 || Math.abs(rpos.y) > 1) return CODE.ERR_NOT_IN_RANGE;

		const target = this.owner.cell.new().add(rpos);
		const TCI = I(target); // Target cell index
		const ECI = I(this.owner.cell.new()); // Entity cell index

		// HACK:
		if(Math.abs(world.height_map[ECI] - world.height_map[TCI]) > 0.1) return CODE.ERR_BIG_DIFF_HEIGHT;

		return;
	}

	public spawn(blueprint: IBlueprint | string, rpos: Vector2 = Vector2.ZERO) {
		const bp = typeof blueprint === 'string' ? codenv.blueprints[blueprint] : blueprint;

		const code = this.canSpawn(bp, rpos);
		if(isError(code)) return code;

		return world.create(this.owner.cell.new().add(rpos), bp.modules as [], bp.params);
	}
}


mod_env[ID] = ENV;
mod_st[ID] = st_model;
modules[ID] = BuildModule;

declare module '@/modules' {
	namespace mod_env { let build: typeof ENV; }
	namespace mod_st { let build: typeof st_model; }
	namespace modules { let build: typeof BuildModule; }
}
