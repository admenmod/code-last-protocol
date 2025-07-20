import { Vector2 } from 'ver/Vector2';
import type { APIResult } from '@/code/Executor';
import { Module } from './Module';
import { EntityParams, mod_env, mod_st, modules } from '@/modules';
import { CODE, isError } from '@/code/code';
import { Cargo } from '@/utils/cargo';
import { world } from '@/game/world';
import { Entity } from '@/game/Entity';
import { number, object } from '@/utils/strc-types';
import { st } from 'ver/super-type';


const ID = 'cargo';
type ID = typeof ID;

type Iter = Generator<[ID, string, ...any[]], any, any>;

export declare namespace CargoModule {
	export interface IOwner extends Entity<[ID]> {}
}

type IOwner = CargoModule.IOwner;


const st_model = object({
	[ID]: {
		size: number
	}
});

const TIME = 1000;

const ENV = (module: CargoModule) => ({
	cargo: {
		get filled() { return module.cargo.fullness_normaloze > 0.9; },

		*transfer(target?: Vector2): Iter {
			if(!target) throw new Error('"transfer" invalid argumnets');
			return yield [ID, 'transfer', target.new()];
		}
	}
});

const API = {
	// HACK: all transfer
	transfer: (module, target: Vector2) => ({ time: TIME, task: () => module.transfer(target, () => true) })
} satisfies Record<string, (module: CargoModule, ...args: any) => APIResult<any>>;

export class CargoModule extends Module<ID, IOwner> {
	public cargo: Cargo;

	constructor(owner: IOwner, { cargo }: EntityParams<[ID]>) {
		super(ID, owner, API);

		if(!cargo?.size) throw new Error('invalid cargo size');

		this.cargo = new Cargo(cargo.size);
	}

	public canTransfer(target: Vector2, predicate: Parameters<Cargo['get']>[0]) {
		const diff = target.new().sub(this.owner.cell);
		if(Math.abs(diff.x) > 1 || Math.abs(diff.y) > 1) return CODE.ERR_NOT_IN_RANGE;

		const a = this.owner.get(CargoModule)!;
		const b = world.entitys.find(it => it.get(CargoModule) && it.cell.isStaticRectIntersect({
			x: it.cell.x-it.size.x/2,
			y: it.cell.y-it.size.y/2,
			w: it.size.y,
			h: it.size.y
		}))?.get(CargoModule);

		if(!b) return CODE.ERR_TARGET_NOT_FOUND;

		// HACK: user code __transfer__
		// if(!this.entity_evaluetors.get(a)?.entry_points.__transfer__.call(null)) return CODE.NOT_ALLOWED;

		const { error } = b.cargo.checkLimit(...a.cargo.get(predicate));
		if(error.length) return CODE.ERR_CARGO_IS_OVERFLOWING;

		return;
	}

	// TODO: сделать items на землю
	public transfer(target: Vector2, predicate: Parameters<Cargo['get']>[0]) {
		const code = this.canTransfer(target, predicate);
		if(isError(code)) return code;

		const a = this.owner.get(CargoModule)!;
		const b = world.entitys.find(it => it.get(CargoModule) && it.cell.isStaticRectIntersect({
			x: it.cell.x-it.size.x/2,
			y: it.cell.y-it.size.y/2,
			w: it.size.y,
			h: it.size.y
		}))?.get(CargoModule)!;

		const cargo_ = a.cargo;
		const _cargo = b.cargo;

		return cargo_.transfer(_cargo, () => true);
	}
}


mod_env[ID] = ENV;
mod_st[ID] = st_model;
modules[ID] = CargoModule;

declare module '@/modules' {
	namespace mod_env { let cargo: typeof ENV; }
	namespace mod_st { let cargo: typeof st_model; }
	namespace modules { let cargo: typeof CargoModule; }

	interface IEntityParams extends st.infer<typeof st_model> {}
}
