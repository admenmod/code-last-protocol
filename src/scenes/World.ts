import { math as Math, delay } from 'ver/helpers';
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
import { EvaluetorUnit } from '@/code/EvaluetorUnit';
import { Cargo } from '@/world/cargo';
import { Unit } from '@/world/unit';
import { Structure } from '@/world/structure';
import { EvaluetorStructure } from '@/code/EvaluetorStructure';


export type IScanData = {
	pos: Vector2;
	time: number;
	values: Record<string, number>;
}[];


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

		return CODE.OK;
	}
	public move(unit: Unit, rpos: Vector2) {
		const code = this.hasMoveToPos(unit, rpos);

		if(code === CODE.OK) unit.cell.add(rpos);

		return code;
	}
	public moveTo(unit: Unit, pos: Vector2, speed: number) {
		return this.move(unit, pos.new().sub(unit.cell).sign().inc(speed));
	}
	public moveForward(unit: Unit, speed: number) {
		return this.move(unit, dirToVec2(unit.diration).inc(speed));
	}

	public radarScan(pos: Vector2, height: number, force: number): IScanData {
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


	public extract(pos: Vector2, height: number, force: number) {
		const i = I(pos);
		const resource = this.$map.resources_map[i];

		if(resource <= 0) return CODE.ERR_RESOURCE_NOT_FOUND;

		const items: Cargo.Item[] = [{ title: 'resource', bulk: 1, count: force }];
		this.$map.resources_map[i] -= 0.01;

		this['@ResourcesExtract'].emit(items, []);

		return items;
	}

	public resources_cargo = new WeakMap<Unit | Structure, Cargo>();
	public unitExtract(unit: Unit, rpos: Vector2) {
		const items = this.extract(unit.cell.new().add(rpos), this.getUnitHeight(unit), 1);
		if(typeof items === 'symbol') return items;

		const cargo = this.resources_cargo.get(unit)!;

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

		const cargo = this.resources_cargo.get(structure)!;

		const { allowed, error } = cargo.spawn(...items);

		this['@ResourcesExtract:structure'].emit(allowed, error, structure);

		return { allowed, error };
	}


	public unit_evaluetors = new Map<Unit, EvaluetorUnit>();
	public structure_evaluetors = new Map<Structure, EvaluetorStructure>();


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

		const cargo_ = this.resources_cargo.get(a)!;
		const _cargo = this.resources_cargo.get(b)!;

		return cargo_.transfer(_cargo, () => true);
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

		this.on('RadarScan', (next, prev, data) => this.scanedRender(data));

		this.$map.on('PostRender', ({ ctx }) => {
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(this.scaned_canvas.canvas, -SIZE_X/2, -SIZE_Y/2, SIZE_X, SIZE_Y);
		});

		this.on('ResourcesExtract:unit', (allowed, error, unit) => {
			alert(JSON.stringify(this.resources_cargo.get(unit)!, null, '  '));
		});


		const code_unit = await fetch(`${location.origin}/user/unit.js`).then(data => data.text());
		const code_structure = await fetch(`${location.origin}/user/structure.js`).then(data => data.text());

		this.$units.on('create', unit => {
			const evaluetor = new EvaluetorUnit(code_unit, this, unit);
			this.radar_scan_data.set(unit, []);
			this.resources_cargo.set(unit, new Cargo(unit.copasity));
			this.unit_evaluetors.set(unit, evaluetor);
			evaluetor.run();
		});

		this.$structures.on('create', structure => {
			const evaluetor = new EvaluetorStructure(code_structure, this, structure);
			this.radar_scan_data.set(structure, []);
			this.resources_cargo.set(structure, new Cargo(200));
			this.structure_evaluetors.set(structure, evaluetor);
			evaluetor.run();
		});
	}

	public scaned_canvas = new OffscreenCanvas(W, H).getContext('2d')!;

	public scanedRender(data: IScanData, ctx = this.scaned_canvas) {
		ctx.save();
		ctx.clearRect(0, 0, W, H);

		for(let i = 0; i < data.length; i++) {
			const { pos, values } = data[i];
			this.$map.drawCalls(pos.new().add(W/2, H/2), values, ctx);
		}
		ctx.restore();
	}


	protected override _process(dt: number): void {
		for(const evaluetor of this.unit_evaluetors.values()) {
			evaluetor.tick(dt);
		}
	}
}
