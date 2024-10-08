import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import { JSONcopy, math as Math, object as Object } from 'ver/helpers';

import { Control } from 'lib/scenes/Control';
import { GridMap } from 'lib/scenes/gui/GridMap';

import { ItemsL } from './ItemsL';
import { UnitsL } from './UnitsL';
import { StructuresL } from './StructuresL';
import { H, I, SIZE_X, SIZE_Y, W, WorldMap } from './WorldMap';

import { Env } from '@/world/env';
import { dirToVec2 } from '@/utils/cell';
import { CODE } from '@/code/code';
import { CELL_SIZE } from '@/config';
import { ka_main } from '@/keyboard';
import { Unit } from '@/world/unit';
import { Structure } from '@/world/structure';
import { Evaluetor } from '@/code/Evaluetor';
import { Entity } from '@/world/Entity';
import type { Cargo } from '@/world/cargo';
import { god_global_event } from '@/app/game/state';


const is_error = (status_code: unknown) => typeof status_code === 'symbol';

export type IScanData = {
	time: number;
	pos: Vector2;
	cell: Record<string, number>;
	units: { type: string; }[];
	structures: { type: string; }[];
}[];


const copyScanData = <T extends IScanData | IScanData[number]>(o: T): T => {
	const r = JSONcopy(o);
	if(Array.isArray(r)) for(let i = 0; i < r.length; i++) r[i].pos = Vector2.from(r[i].pos);
	else r.pos = Vector2.from(r.pos);
	return r;
};

export class World extends Control {
	public '@RadarScan' = new Event<World, [next: IScanData, prev: IScanData, data: IScanData]>(this);
	public '@ResourcesExtract' = new Event<World, [allowed: Cargo.Item[], error: Cargo.Item[], ]>(this);
	public '@ResourcesExtract:unit' = new Event<World, [allowed: Cargo.Item[], error: Cargo.Item[], unit: Unit]>(this);
	public '@ResourcesExtract:structure' = new Event<World, [
		allowed: Cargo.Item[], error: Cargo.Item[], structure: Structure
	]>(this);


	public override TREE() { return {
		WorldMap,
		StructuresL,
		UnitsL,
		ItemsL,
		GridMap
	}}

	// aliases
	public get $gridMap() { return this.get('GridMap'); }
	public get $map() { return this.get('WorldMap'); }
	public get $items() { return this.get('UnitsL'); }
	public get $units() { return this.get('UnitsL'); }
	public get $structures() { return this.get('StructuresL'); }


	public communication_network = new Env.CommunicationNetwork();
	public electrical_network = new Env.ElectricalNetwork();

	public getUnitHeight(unit: Unit) { return this.$map.height_map[I(unit.cell)]; }
	public getStructureHeight(structure: Structure) { return this.$map.height_map[I(structure.cell)]; }

	public canMoveToPos(unit: Unit, rpos: Vector2) {
		if(rpos.isSame(Vector2.ZERO)) return CODE.TARGET_DISTANCE_ZERO;
		if(Math.abs(rpos.x) > 1 || Math.abs(rpos.y) > 1) return CODE.ERR_NOT_IN_RANGE;

		const target = unit.cell.new().add(rpos);
		const TCI = I(target); // Target cell index
		const UCI = I(unit.cell.new()); // Unit cell index

		if(Math.abs(this.$map.height_map[UCI] - this.$map.height_map[TCI]) > 0.1) return CODE.ERR_BIG_DIFF_HEIGHT;

		return;
	}
	public move(unit: Unit, rpos: Vector2) {
		const code = this.canMoveToPos(unit, rpos);

		if(typeof code !== 'symbol') unit.cell.add(rpos);
		// if(typeof code !== 'symbol') anims.run(unitMoveAnim, unit, rpos);

		return code;
	}
	public moveTo(unit: Unit, pos: Vector2, speed: number) {
		return this.move(unit, pos.new().sub(unit.cell).sign().inc(speed));
	}
	public moveForward(unit: Unit, speed: number) {
		return this.move(unit, dirToVec2(unit.diration).inc(speed));
	}

	public radarScan(pos: Vector2, _height: number, force: number): IScanData {
		const arr: IScanData = [];

		for(let y = pos.y-force; y < pos.y+1+force; y++) {
			for(let x = pos.x-force; x < pos.x+1+force; x++) {
				const pos = new Vector2(x, y);
				const i = I(pos);

				arr.push({ pos, time: Date.now(), cell: {
					height: this.$map.height_map[i],
					resource: this.$map.resources_map[i]
				}, units: [], structures: [] });
			}
		}

		return arr;
	}

	public radar_scan_data = new WeakMap<Unit | Structure, IScanData>();
	public unitRadarScan(unit: Unit): IScanData {
		const next = this.radarScan(unit.cell, this.getUnitHeight(unit), 1);
		const data = this.radar_scan_data.get(unit)!;
		const prev = [...data];

		if(!this.radar_scan_data.has(unit)) this.radar_scan_data.set(unit, data);

		for(let i = 0; i < next.length; i++) {
			const o = data.find(it => it.pos.isSame(next[i].pos) && it.time < next[i].time);

			// HACK:
			if(o) Object.assign(o.cell, next[i].cell);
			else data.push(copyScanData(next[i]));
		}

		this['@RadarScan'].emit(next, prev, data);

		return next;
	}

	public structureRadarScan(structure: Structure): IScanData {
		const next = this.radarScan(structure.cell, this.getStructureHeight(structure), 3);
		const data = this.radar_scan_data.get(structure)!;
		const prev = [...data];

		if(!this.radar_scan_data.has(structure)) this.radar_scan_data.set(structure, data);

		for(let i = 0; i < next.length; i++) {
			const o = data.find(it => it.pos.isSame(next[i].pos) && it.time < next[i].time);

			// HACK:
			if(o) Object.assign(o.cell, next[i].cell);
			else data.push(copyScanData(next[i]));
		}

		this['@RadarScan'].emit(next, prev, data);

		return next;
	}


	public extract(pos: Vector2, _height: number, force: number) {
		const i = I(pos);
		const resource = this.$map.resources_map[i];

		if(resource <= 0) return CODE.ERR_RESOURCE_NOT_FOUND;

		const items: Cargo.Item[] = [{ title: 'resource', bulk: 1, count: force }];
		this.$map.resources_map[i] -= 0.01;

		this['@ResourcesExtract'].emit(items, []);

		return items;
	}

	public unitExtract(unit: Unit, rpos: Vector2, count: number = 1) {
		const items = this.extract(unit.cell.new().add(rpos), this.getUnitHeight(unit), 1 * count);
		if(typeof items === 'symbol') return items;

		const cargo = unit.cargo;

		const { allowed, error } = cargo.spawn(...items);

		this['@ResourcesExtract:unit'].emit(allowed, error, unit);

		return { allowed, error };
	}
	public unitExtractForward(unit: Unit, distance: number) {
		return this.unitExtract(unit, dirToVec2(unit.diration).inc(distance));
	}

	public structureExtract(structure: Structure) {
		const items = this.extract(structure.cell.new(), this.getStructureHeight(structure), 10);
		if(typeof items === 'symbol') return items;

		const cargo = structure.cargo;

		const { allowed, error } = cargo.spawn(...items);

		this['@ResourcesExtract:structure'].emit(allowed, error, structure);

		return { allowed, error };
	}


	public canTransfer(a: Unit | Structure, target: Vector2, predicate: Parameters<Cargo['get']>[0]) {
		const diff = target.new().sub(a.cell);
		if(Math.abs(diff.x) > 1 || Math.abs(diff.y) > 1) return CODE.ERR_NOT_IN_RANGE;

		const b = this.$units.items.find(it => it.cell.isStaticRectIntersect({
			x: it.cell.x-it.size.x/2,
			y: it.cell.y-it.size.y/2,
			w: it.size.y,
			h: it.size.y
		})) || this.$structures.items.find(it => it.cell.isStaticRectIntersect({
			x: it.cell.x-it.size.x/2,
			y: it.cell.y-it.size.y/2,
			w: it.size.y,
			h: it.size.y
		}));

		if(!b) return CODE.ERR_TARGET_NOT_FOUND;

		if(!this.entity_evaluetors.get(a)?.entry_points.__transfer__.call(null)) return CODE.NOT_ALLOWED;

		const { error } = b.cargo.checkLimit(...a.cargo.get(predicate));
		if(error.length) return CODE.ERR_CARGO_IS_OVERFLOWING;

		return;
	}

	// TODO: сделать items на землю
	public transfer(a: Unit | Structure, target: Vector2, predicate: Parameters<Cargo['get']>[0]) {
		const code = this.canTransfer(a, target, predicate);
		if(is_error(code)) return code;

		const b = this.$units.items.find(it => it.cell.isStaticRectIntersect({
			x: it.cell.x-it.size.x/2,
			y: it.cell.y-it.size.y/2,
			w: it.size.y,
			h: it.size.y
		})) || this.$structures.items.find(it => it.cell.isStaticRectIntersect({
			x: it.cell.x-it.size.x/2,
			y: it.cell.y-it.size.y/2,
			w: it.size.y,
			h: it.size.y
		}))!;

		const cargo_ = a.cargo;
		const _cargo = b.cargo;

		return cargo_.transfer(_cargo, () => true);
	}


	public scaned_canvas = new OffscreenCanvas(W, H).getContext('2d')!;

	public scanedRender(data: IScanData, ctx = this.scaned_canvas) {
		ctx.save();
		// ctx.clearRect(0, 0, W, H);

		for(let i = 0; i < data.length; i++) {
			const { pos, cell } = data[i];
			this.$map.drawCalls(pos.new().add(W/2, H/2), cell, ctx);
		}
		ctx.restore();
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
	public spawnUnit<T extends typeof Unit>(entity: Entity, rpos: Vector2, Class: T) {
		const code = this.canSpawnUnit(entity, rpos, Class);
		if(is_error(code)) return code;
		return this.$units.create<typeof Unit>(Class, entity.cell.new().add(rpos), this) as InstanceType<T>;
	}


	public evaluetors_entity = new Map<Evaluetor<any>, Entity>();
	public entity_evaluetors = new Map<Entity, Evaluetor<any>>();

	protected override async _init(this: World): Promise<void> {
		await super._init();

		this.on('input:click', ({ pos }) => {
			const cell = pos.new().div(CELL_SIZE).floor();

			const unit = this.$units.getByPos(cell.new());
			if(!unit) return;

			// showUnitEditPanel(unit);
		});

		this.$gridMap.position.set();
		this.$gridMap.size.set(W, H).inc(CELL_SIZE);
		this.$gridMap.tile.set(CELL_SIZE);

		ka_main.register(['m', '1'], () => {
			this.$map.draw_mode = 'height';
			this.$map.mapRender();
		});
		ka_main.register(['m', '2'], () => {
			this.$map.draw_mode = 'height+demp';
			this.$map.mapRender();
		});

		this.on('RadarScan', (_next, _prev, data) => this.scanedRender(data));

		this.$map.on('PostRender', ({ ctx }) => {
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(this.scaned_canvas.canvas, -SIZE_X/2, -SIZE_Y/2, SIZE_X, SIZE_Y);
		});

		this.on('ResourcesExtract:unit', (_allowed, _error, unit) => {
			alert(JSON.stringify(unit.cargo, null, '  '));
		});


		const code_unit = await fetch(`${location.origin}/user/unit.js`).then(data => data.text());
		// const code_structure = await fetch(`${location.origin}/user/structure.js`).then(data => data.text());

		this.$units.on('create', unit => {
			this.radar_scan_data.set(unit, []);

			const env = Object.fullassign({}, unit.ENV, { memory: Object.create(null), });
			const evaluetor = new Evaluetor(unit.modules, {}, env, 'user/unit.js');
			this.evaluetors_entity.set(evaluetor, unit);
			this.entity_evaluetors.set(unit, evaluetor);

			evaluetor.run(code_unit);
		});

		god_global_event.on(code => {
			for(const evaluetor of this.evaluetors_entity.keys()) {
				evaluetor.run(code);
			}
		});

		this.$structures.on('create', structure => {
			this.radar_scan_data.set(structure, []);

			// const env = Object.fullassign({}, ENV_STRUCTURE(this, structure));
			// const evaluetor = new Evaluetor(this.scripts_system, {}, env, 'user/structure.js');
			// this.evaluetors.set(evaluetor, structure);
			//
			// evaluetor.run(code_structure);
		});
	}

	protected override _process(dt: number): void {
		for(let i = 0; i < this.$units.items.length; i++) this.$units.items[i].update(dt);
		for(let i = 0; i < this.$structures.items.length; i++) this.$structures.items[i].update(dt);
	}
}
