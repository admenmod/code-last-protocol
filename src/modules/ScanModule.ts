import { Vector2 } from 'ver/Vector2';
import { modules, ENV, modules_env } from '../modules';
import { world } from '@/game/world';
import { Module } from '@/game/EModule';
import { APIResult } from '@/code/Executor';
import { IScanData } from '@/game/types';
import { Entity } from '@/game/Entity';
import { I } from '@/scenes/WorldMap';


const ID = 'scan';
type ID = typeof ID;

type Iter = Generator<[ID, string, ...any[]], any, any>;

export declare namespace ScanModule {
	export interface IOwner extends Entity {}
}

type IOwner = ScanModule.IOwner;


const TIME = 1000;

const ENV = (_module: ScanModule) => ({
	*scan(): Iter { return yield ['scan', 'scan']; }
});

const API = {
	scan: (module) => ({ time: TIME, cache: 'TASK_LAST_LINK',
		task: () => module.radarScan(module.owner.cell.new(), module.owner.height, 1)
	})
} satisfies Record<string, (module: ScanModule, ...args: any) => APIResult<any>>;

class ScanModule extends Module<IOwner> {
	constructor(owner: IOwner) {
		super(ID, owner, API);
		this.ENV = ENV(this);
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

		return arr;
	}
}


modules[ID] = ScanModule;
modules_api[ID] = API;
modules_env[ID] = ENV;

declare module '../modules' {
	namespace modules {
		let scan: typeof ScanModule;
	}

	namespace modules_env {
		let scan: typeof ENV;
	}
}
