import { math as Math, object as Object } from 'ver/helpers';
import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';

import { Node } from 'lib/scenes/Node';
import { GridMap } from 'lib/scenes/gui/GridMap';

import { UnitsL } from './UnitsL';
import { StructuresL } from './StructuresL';
import { H, I, SIZE_X, SIZE_Y, W, WorldMap } from './WorldMap';

import { Env } from '@/world/env';
import { dirToVec2 } from '@/utils/cell';
import { CODE } from '@/code/code';
import { CELL_SIZE } from '@/config';
import { ka_main } from '@/keyboard';
import { ENV_UNIT, Unit } from '@/world/unit';
import { Structure } from '@/world/structure';
// import { ScriptsSystem } from '@/ScriptsSystem';
import { Evaluetor } from '@/code/Evaluetor';
import { Entity } from '@/world/Entity';
import type { Cargo } from '@/world/cargo';
import { god_global_event } from '@/app/game/state';

export type IScanData = {
	pos: Vector2;
	time: number;
	values: Record<string, number>;
}[];


// const API_STRUCTURE = (world: World, structure: Structure) => ({
// 	scan: () => ({ time: TIME, data: world.structureRadarScan(structure) }),
// 	extract: () => ({ time: TIME, data: world.structureExtract(structure) }),
// 	transfer: (target: Vector2) => ({ time: TIME, data: world.transfer(structure, target) })
// });
//
// const ENV_STRUCTURE = (world: World, structure: Structure) => ({
// 	memory: { base_position: new Vector2(0, 0) },
// 	*scan(): Iter { return yield ['scan']; },
// 	*extract(): Iter { return yield ['extract']; },
// 	*transfer(target?: Vector2): Iter {
// 		if(!target) throw new Error('"transfer" invalid argumnets '+String(target));
// 		return yield ['transfer', target.new()];
// 	},
// 	get cargo_filled() { return world.resources_cargo.get(structure)!.fullness_normaloze > 0.9; },
// 	get diration() { return structure.diration; }
// });


export class World extends Node {
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
		GridMap
	}}

	// aliases
	public get $gridMap() { return this.get('GridMap'); }
	public get $map() { return this.get('WorldMap'); }
	public get $units() { return this.get('UnitsL'); }
	public get $structures() { return this.get('StructuresL'); }


	public communication_network = new Env.CommunicationNetwork();
	public electrical_network = new Env.ElectricalNetwork();

	public getUnitHeight(unit: Unit) { return this.$map.height_map[I(unit.cell)]; }
	public getStructureHeight(structure: Structure) { return this.$map.height_map[I(structure.cell)]; }

	public hasMoveToPos(unit: Unit, rpos: Vector2) {
		if(rpos.isSame(Vector2.ZERO)) return CODE.TARGET_DISTANCE_ZERO;
		if(Math.abs(rpos.x) > 1 || Math.abs(rpos.y) > 1) return CODE.ERR_NOT_IN_RANGE;

		const target = unit.cell.new().add(rpos);
		const TCI = I(target); // Target cell index
		const UCI = I(unit.cell.new()); // Unit cell index

		if(Math.abs(this.$map.height_map[UCI] - this.$map.height_map[TCI]) > 0.1) return CODE.ERR_BIG_DIFF_HEIGHT;

		return;
	}
	public move(unit: Unit, rpos: Vector2) {
		const code = this.hasMoveToPos(unit, rpos);

		if(typeof code !== 'symbol') unit.cell.add(rpos);

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

				arr.push({ pos, time: Date.now(), values: {
					height: this.$map.height_map[i],
					resource: this.$map.resources_map[i]
				}});
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
			const o = data.find(it => it.pos.isSame(next[i].pos));

			if(o) Object.assign(o.values, next[i].values);
			else data.push({ pos: next[i].pos, time: next[i].time, values: { ...next[i].values } });
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
			const o = data.find(it => it.pos.isSame(next[i].pos));

			if(o) Object.assign(o.values, next[i].values);
			else data.push({ pos: next[i].pos, time: next[i].time, values: { ...next[i].values } });
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

	public unitExtract(unit: Unit, rpos: Vector2) {
		const items = this.extract(unit.cell.new().add(rpos), this.getUnitHeight(unit), 1);
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


	public evaluetors = new Map<Evaluetor<any>, Entity>();

	// public scripts_system = new ScriptsSystem((owner, dt, _time, value) => {
	// 	if(value === null) return { time: null, data: null };
	// 	if(typeof value === 'undefined') return { time: void 0, data: void 0 };
	// 	if(!Array.isArray(value)) throw new Error('invalid request');
	//
	// 	const [id, ctx, ...args] = value;
	// 	console.group({ dt, id, ctx, args });
	//
	// 	const obj = this.evaluetors.get(owner as Evaluetor<any>)!;
	//
	// 	if(obj instanceof Unit) {
	// 		if(!(id in obj.API)) throw new Error(`unknown request "${id}"`);
	// 		const data = (obj.API as any)[id](this, obj, id, ...args);
	// 		console.groupEnd();
	// 		return data;
	// 	} else if(obj instanceof Structure) {
	// 		// const data = API_STRUCTURE(this, obj)[id](...args);
	// 		// console.groupEnd();
	// 		// return data;
	// 		throw new Error('work');
	// 	} else throw new Error('unknown request owner');
	// });


	// TODO: сделать items на землю
	public transfer(a: Unit | Structure, target: Vector2) {
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

		const cargo_ = a.cargo;
		const _cargo = b.cargo;

		return cargo_.transfer(_cargo, () => true);
	}


	public scaned_canvas = new OffscreenCanvas(W, H).getContext('2d')!;

	public scanedRender(data: IScanData, ctx = this.scaned_canvas) {
		ctx.save();
		// ctx.clearRect(0, 0, W, H);

		for(let i = 0; i < data.length; i++) {
			const { pos, values } = data[i];
			this.$map.drawCalls(pos.new().add(W/2, H/2), values, ctx);
		}
		ctx.restore();
	}


	protected override async _init(this: World): Promise<void> {
		await super._init();

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

			const env = Object.fullassign({}, ENV_UNIT(this, unit), {
				memory: Object.create(null),
			});
			const evaluetor = new Evaluetor(unit.modules, {}, env, 'user/unit.js');
			this.evaluetors.set(evaluetor, unit);

			evaluetor.run(code_unit);
		});

		god_global_event.on(code => {
			for(const evaluetor of this.evaluetors.keys()) {
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

		// this.scripts_system.start();
	}

	protected override _process(dt: number): void {
		for(let i = 0; i < this.$units.items.length; i++) this.$units.items[i].update(dt);
	}
}
