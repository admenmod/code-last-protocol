import { Vector2 } from 'ver/Vector2';
import { Module } from '../EModule';
import { APIResult } from '@/code/Executor';
import { World, world } from '@/game/world';
import { CODE, isError } from '@/code/code';
import { I } from '@/scenes/WorldMap';
import { Cargo } from '@/utils/cargo';


const ID = 'build';
type ID = typeof ID;

type Iter = Generator<[ID, string, ...any[]], any, any>;

export declare namespace BuildModule {
	export interface IOwner extends World.Object {
	}
}

type IOwner = BuildModule.IOwner;


const TIME = 1000;

const ENV = (module: BuildModule) => ({
	*build(): Iter {
		return yield ['build', 'build'];
	}
});

const API = {
	build: (module, id: string) => ({ time: TIME, task: () => module.spawnUnit() })
} satisfies Record<string, (module: BuildModule, ...args: any) => APIResult<any>>;

export class BuildModule extends Module<IOwner> {
	constructor(owner: IOwner) {
		super(ID, owner, API);
		this.ENV = ENV(this);
	}

	public canSpawnUnit(entity: Entity, rpos: Vector2, Class: typeof Unit) {
		if(rpos.isSame(Vector2.ZERO)) return CODE.TARGET_DISTANCE_ZERO;
		if(Math.abs(rpos.x) > 1 || Math.abs(rpos.y) > 1) return CODE.ERR_NOT_IN_RANGE;

		const target = entity.cell.new().add(rpos);
		const TCI = I(target); // Target cell index
		const ECI = I(entity.cell.new()); // Entity cell index

		if(Math.abs(this.$map.height_map[ECI] - this.$map.height_map[TCI]) > 0.1) return CODE.ERR_BIG_DIFF_HEIGHT;

		if('cargo' in entity) (entity.cargo as Cargo).search(...Class.build_resources);

		return;
	}
	public spawnUnit<T extends typeof Unit>(entity: Entity, rpos: Vector2, Class: T, Modules: (new (world: World, owner: Entity) => Module<Entity>)[]) {
		const code = this.canSpawnUnit(entity, rpos, Class);
		if(isError(code)) return code;
		return this.$units.create<typeof Unit>(Class, entity.cell.new().add(rpos), this, Modules) as InstanceType<T>;
	}
}
