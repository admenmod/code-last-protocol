import { z } from 'zod';
import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import { modules, mod_env, IEntityParams, EntityParams, mod_zod } from '@/modules';
import { I, world } from '@/game/world';
import { Module } from '@/modules/Module';
import { APIResult } from '@/code/Executor';
import { IScanData } from '@/game/types';
import { Entity } from '@/game/Entity';


const ID = 'scan';
type ID = typeof ID;

type Iter = Generator<[ID, string, ...any[]], any, any>;

export declare namespace ScanModule {
	export interface IOwner extends Entity<[ID]> {}
}

type IOwner = ScanModule.IOwner;

const zod_model = z.object({
	[ID]: z.object({
		force: z.number().min(1)
	})
});


const TIME = 1000;

const ENV = (_module: ScanModule) => ({
	*scan(): Iter { return yield ['scan', 'scan']; }
});

const API = {
	scan: (module) => ({ time: TIME, cache: 'TASK_LAST_LINK', task: () => module.scan() })
} satisfies Record<string, (module: ScanModule, ...args: any) => APIResult<any>>;

class ScanModule extends Module<ID, IOwner, IEntityParams> {
	public '@scan' = new Event<ScanModule, [data: IScanData]>(this);


	public force: number;

	constructor(owner: IOwner, { scan }: EntityParams<[ID]>) {
		super(ID, owner, API);

		if(!scan?.force) throw new Error('invalid scan.force');

		this.force = scan.force;
	}

	public radarScan(pos: Vector2, _height: number, force: number): IScanData {
		const arr: IScanData = [];

		for(let y = pos.y-force; y < pos.y+1+force; y++) {
			for(let x = pos.x-force; x < pos.x+1+force; x++) {
				const pos = new Vector2(x, y);
				const i = I(pos);

				arr.push({ pos, time: Date.now(), cell: {
					height: world.height_map[i],
					resource: world.resources_map[i]
				}, units: [], structures: [] });
			}
		}

		this['@scan'].emit(arr);

		return arr;
	}

	public scan() { return this.radarScan(this.owner.cell.new(), this.owner.height, this.force); }
}


mod_env[ID] = ENV;
mod_zod[ID] = zod_model;
modules[ID] = ScanModule;

declare module '@/modules' {
	namespace mod_env { let scan: typeof ENV; }
	namespace mod_zod { let scan: typeof zod_model; }
	namespace modules { let scan: typeof ScanModule; }
}
