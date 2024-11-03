import { Vector2 } from 'ver/Vector2';
import type { APIResult } from '@/code/Executor';
import { Module } from './Module';
import { modules } from '@/modules';
import { CODE, isError } from '@/code/code';
import { Cargo } from '@/utils/cargo';
import { world } from '@/game/world';
import { Entity } from '@/game/Entity';


const ID = 'cargo';
type ID = typeof ID;

type Iter = Generator<[ID, string, ...any[]], any, any>;

export declare namespace CargoModule {
	export interface IOwner extends Entity {}
}

type IOwner = CargoModule.IOwner;


const TIME = 1000;

const ENV = (module: CargoModule) => ({
	get cargo_filled() { return module.cargo.fullness_normaloze > 0.9; },

	*transfer(target?: Vector2): Iter {
		if(!target) throw new Error('"transfer" invalid argumnets');
		return yield [ID, 'transfer', target.new()];
	}
});

const API = {
	// HACK: all transfer
	transfer: (module, target: Vector2) => ({ time: TIME, task: () => module.transfer(target, () => true) })
} satisfies Record<string, (module: CargoModule, ...args: any) => APIResult<any>>;

export interface IParams {
	cargo_size: number;
}

export class CargoModule extends Module<ID, IOwner, IParams> {
	public cargo = new Cargo(10);

	constructor(owner: IOwner, p: CargoModule) { super(ID, owner, API); }

	public canTransfer(target: Vector2, predicate: Parameters<Cargo['get']>[0]) {
		const diff = target.new().sub(this.owner.cell);
		if(Math.abs(diff.x) > 1 || Math.abs(diff.y) > 1) return CODE.ERR_NOT_IN_RANGE;

		const a = this.owner.modules.find(it => it instanceof CargoModule)!;
		const b = world.entitys.find(it => it.modules.find(it => it instanceof CargoModule) && it.cell.isStaticRectIntersect({
			x: it.cell.x-it.size.x/2,
			y: it.cell.y-it.size.y/2,
			w: it.size.y,
			h: it.size.y
		}))?.modules.find(it => it instanceof CargoModule);

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

		const a = this.owner.modules.find(it => it instanceof CargoModule)!;
		const b = world.entitys.find(it => it.modules.find(it => it instanceof CargoModule) && it.cell.isStaticRectIntersect({
			x: it.cell.x-it.size.x/2,
			y: it.cell.y-it.size.y/2,
			w: it.size.y,
			h: it.size.y
		}))?.modules.find(it => it instanceof CargoModule)!;

		const cargo_ = a.cargo;
		const _cargo = b.cargo;

		return cargo_.transfer(_cargo, () => true);
	}
}


modules[ID] = CargoModule;

declare module '../modules' {
	namespace modules {
		let cargo: typeof CargoModule;
	}
}
