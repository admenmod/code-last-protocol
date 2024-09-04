import { math as Math, delay } from 'ver/helpers';
import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';

import { Node } from 'lib/scenes/Node';
import { GridMap } from 'lib/scenes/gui/GridMap';

import { UnitsL } from './UnitsL';
import { StructuresL } from './StructuresL';
import { H, I, SIZE_X, SIZE_Y, W, WorldMap } from './WorldMap';

import { Unit } from '@/world/unit';
import { Env } from '@/world/env';
import { dirToVec2 } from '@/utils/cell';
import { CELL_SIZE } from '@/config';
import { ka_main } from '@/keyboard';
import { EvaluetorUnit } from '@/code/EvaluetorUnit';
import { Cargo } from '@/world/cargo';


type IScanData = {
	pos: Vector2;
	values: Record<string, number>;
}[];


export class World extends Node {
	public '@RadarScan' = new Event<World, [next: IScanData, prev: IScanData, data: IScanData]>(this);
	public '@ResourcesExtract' = new Event<World, [allowed: Cargo.Item[], error: Cargo.Item[], ]>(this);
	public '@ResourcesExtract:unit' = new Event<World, [allowed: Cargo.Item[], error: Cargo.Item[], unit: Unit]>(this);


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
	public get $strutcure() { return this.get('StructuresL'); }


	public communication_network = new Env.CommunicationNetwork();
	public electrical_network = new Env.ElectricalNetwork();

	public getUnitHeight(unit: Unit) { return this.$map.height_map[I(unit.cell)]; }

	public hasMoveToPos(unit: Unit, rpos: Vector2): boolean {
		if(rpos.isSame(Vector2.ZERO)) return false;
		if(Math.abs(rpos.x) > 1 || Math.abs(rpos.y) > 1) throw new Error(`range ${rpos}`);

		const target = unit.cell.new().add(rpos);
		const TCI = I(target); // Target cell index
		const UCI = I(unit.cell.new()); // Unit cell index

		if(Math.abs(this.$map.height_map[UCI] - this.$map.height_map[TCI]) > 0.1) return false;

		return true;
	}
	public move(unit: Unit, rpos: Vector2): boolean {
		if(this.hasMoveToPos(unit, rpos)) {
			unit.cell.add(rpos);
			return true;
		}

		return false;
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

				arr.push({ pos, values: {
					height: this.$map.height_map[i],
					resource: this.$map.resources_map[i]
				}});
			}
		}

		return arr;
	}

	public radar_scan_data = new WeakMap<Unit, IScanData>();
	public unitRadarScan(unit: Unit): IScanData {
		const next = this.radarScan(unit.cell, this.getUnitHeight(unit), 1);
		const data = this.radar_scan_data.has(unit) ? this.radar_scan_data.get(unit)! : [...next];
		const prev = data ? [...data] : [];

		if(!this.radar_scan_data.has(unit)) this.radar_scan_data.set(unit, data);

		for(let i = 0; i < next.length; i++) {
			const o = data.find(it => it.pos.isSame(next[i].pos));

			if(o) Object.assign(o.values, next[i].values);
			else data.push({ pos: next[i].pos, values: { ...next[i].values } });
		}

		this['@RadarScan'].emit(next, prev, data);

		return next;
	}

	public extract(pos: Vector2, height: number, force: number): Cargo.Item[] | false {
		const i = I(pos);
		const resource = this.$map.resources_map[i];

		if(resource <= 0) {
			alert('Error: extract resource');
			return false;
		}

		const items: Cargo.Item[] = [{ title: 'resource', bulk: 1, count: force }];
		this.$map.resources_map[i] -= 0.01;

		this['@ResourcesExtract'].emit(items, []);

		return items;
	}

	public resources_cargo = new WeakMap<Unit, Cargo>();
	public unitExtract(unit: Unit, rpos: Vector2) {
		const items = this.extract(unit.cell.new().add(rpos), this.getUnitHeight(unit), 10);
		if(!items) return false;

		const cargo = this.resources_cargo.has(unit) ? this.resources_cargo.get(unit)! : new Cargo(10);
		if(!this.resources_cargo.has(unit)) this.resources_cargo.set(unit, cargo);

		const { allowed, error } = cargo.spawn(...items);

		this['@ResourcesExtract:unit'].emit(allowed, error, unit);

		return { allowed, error };
	}
	public unitExtractForward(unit: Unit, distance: number) {
		return this.unitExtract(unit, dirToVec2(unit.diration).inc(distance));
	}


	public unit_evaluetors = new Map<Unit, EvaluetorUnit>();


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


		const code = await fetch(`${location.origin}/user/unit.js`).then(data => data.text());

		this.$units.on('create', unit => {
			const evaluetor = new EvaluetorUnit(code, this, unit);
			this.unit_evaluetors.set(unit, evaluetor);
			this.resources_cargo.set(unit, new Cargo(10));
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
		for(const [unit, evaluetor] of this.unit_evaluetors) {
			evaluetor.tick(dt);
		}
	}
}
