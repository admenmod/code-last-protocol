import { math as Math } from 'ver/helpers';
import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';

import { Node } from 'lib/scenes/Node';
import { GridMap } from 'lib/scenes/gui/GridMap';

import { UnitsL } from './UnitsL';
import { StructuresL } from './StructuresL';
import { ResourcesL } from './ResourcesL';
import { H, I, SIZE_X, SIZE_Y, W, WorldMap } from './WorldMap';

import { Unit } from '@/world/unit';
import { Env } from '@/world/env';
import { dirToVec2 } from '@/utils/cell';
import { CELL_SIZE } from '@/config';
import { ka_main } from '@/keyboard';


type IScanData = {
	pos: Vector2;
	value: number;
}[];
type IResourcesCargo = {
	title: string;
	count: number;
}[];


export class World extends Node {
	public '@RadarScan' = new Event<World, [next: IScanData, prev: IScanData, data: IScanData]>(this);
	public '@ResourcesExtract' = new Event<World, [res: IResourcesCargo]>(this);
	public '@ResourcesExtract:unit' = new Event<World, [res: IResourcesCargo, unit: Unit]>(this);


	public override TREE() { return {
		WorldMap,
		ResourcesL,
		StructuresL,
		UnitsL,
		GridMap
	}}
	// aliases
	public get $gridMap() { return this.get('GridMap'); }
	public get $map() { return this.get('WorldMap'); }
	public get $units() { return this.get('UnitsL'); }
	public get $resources() { return this.get('ResourcesL'); }
	public get $strutcure() { return this.get('StructuresL'); }


	public communication_network = new Env.CommunicationNetwork();
	public electrical_network = new Env.ElectricalNetwork();

	public getUnitHeight(unit: Unit) { return this.$map.height_map[I(unit.cell)]; }

	public hasMoveToPos(unit: Unit, rpos: Vector2): boolean {
		const target = unit.cell.new().add(rpos);
		const TCI = I(target); // Target cell index
		const UCI = I(unit.cell.new()); // Unit cell index

		if(Math.abs(this.$map.height_map[UCI] - this.$map.height_map[TCI]) > 0.1) return false;

		return true;
	}
	public move(unit: Unit, rpos: Vector2) {
		if(this.hasMoveToPos(unit, rpos)) unit.cell.add(rpos);
	}
	public moveForward(unit: Unit, speed: number) {
		return this.move(unit, dirToVec2(unit.diration).inc(speed));
	}

	public radarScan(pos: Vector2, height: number, force: number) {
		const arr: IScanData = [];

		for(let y = pos.y-1; y < pos.y+2; y++) {
			for(let x = pos.x-1; x < pos.x+2; x++) {
				const pos = new Vector2(x, y);
				const i = I(pos);

				arr.push({ pos, value: this.$map.height_map[i] });
			}
		}

		return arr;
	}

	public radar_scan_data = new WeakMap<Unit, IScanData>();
	public unitRadarScan(unit: Unit) {
		const next = this.radarScan(unit.cell, this.getUnitHeight(unit), 1);
		const data = this.radar_scan_data.has(unit) ? this.radar_scan_data.get(unit)! : [...next];
		const prev = data ? [...data] : [];

		if(!this.radar_scan_data.has(unit)) this.radar_scan_data.set(unit, data);

		for(let i = 0; i < next.length; i++) {
			if(!data.some(it => it.pos.isSame(next[i].pos))) data.push({ pos: next[i].pos, value: next[i].value });
		}

		this['@RadarScan'].emit(next, prev, data);

		return next;
	}

	public extract(pos: Vector2, height: number, force: number): IResourcesCargo | false {
		const resource = this.$resources.items.find(it => it.cell.isSame(pos));

		if(!resource) {
			alert('Error: extract resource');
			return false;
		}

		const res = [{ title: resource.title, count: force }];

		this['@ResourcesExtract'].emit(res);

		return res;
	}

	public resources_cargo = new WeakMap<Unit, IResourcesCargo>();
	public unitExtract(unit: Unit, rpos: Vector2) {
		const res = this.extract(unit.cell.new().add(rpos), this.getUnitHeight(unit), 1);
		if(!res) return false;

		const cargo = this.resources_cargo.has(unit) ? this.resources_cargo.get(unit)! : [];
		if(!this.resources_cargo.has(unit)) this.resources_cargo.set(unit, cargo);

		for(let i = 0; i < res.length; i++) {
			if(unit.copasity - cargo.reduce((acc, value) => value.count + acc, 0) < res[i].count) continue;

			const r = cargo.find(it => it.title === res[i].title);
			if(r) r.count += res[i].count;
			else cargo.push(res[i]);
		}

		this['@ResourcesExtract:unit'].emit(res, unit);

		return res;
	}
	public unitExtractForward(unit: Unit, distance: number) {
		return this.unitExtract(unit, dirToVec2(unit.diration).inc(distance));
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

		this.on('ResourcesExtract:unit', (res, unit) => {
			alert(JSON.stringify(this.resources_cargo.get(unit)!, null, '  '));
		});
	}


	public scaned_canvas = new OffscreenCanvas(W, H).getContext('2d')!;

	public scanedRender(data: IScanData, ctx = this.scaned_canvas) {
		ctx.save();
		ctx.clearRect(0, 0, W, H);

		ctx.fillStyle = '#0000ee22';
		for(let i = 0; i < data.length; i++) {
			const { pos, value } = data[i];
			ctx.fillRect(pos.x+W/2, pos.y+H/2, 1, 1);
		}
		ctx.restore();
	}
}
