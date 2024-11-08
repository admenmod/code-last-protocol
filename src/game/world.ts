import { Vector2 } from 'ver/Vector2';
import { Event, EventDispatcher } from 'ver/events';
import { math as Math } from 'ver/helpers';

import { Env } from '@/game/Env';
import { Entity } from './Entity';
import type { IScanData } from '@/game/types';


import { CELL_SIZE } from '@/config';
import { generatePerlinNoise } from '@vicimpa/perlin-noise';
import { AnyModuleId, EntityParams } from '@/modules';

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;


export const W = 128, H = 128;
export const MAP_SIZE = W * H;
export const SIZE_X = CELL_SIZE*W, SIZE_Y = CELL_SIZE*H;

export const I = (v: Vector2) => (v.x+W/2) + (v.y+H/2) * W;
export const XY = (i: number) => new Vector2(i % W, Math.floor(i/W));

// const seedR = 0x1d1f10;
// const seedG = 0x1aa80b;
// const seedB = 0x8a2864;

const SEED_HEIGHT_MAP = 0x6147db;


export const world = new class World extends EventDispatcher {
	public '@insert' = new Event<World, [o: Entity]>(this);
	public '@remove' = new Event<World, [o: Entity]>(this);

	public '@create' = new Event<World, [o: Entity]>(this);
	public '@delete' = new Event<World, [o: Entity]>(this);

	public '@scan:update' = new Event<World, [next: IScanData, prev: IScanData, data: IScanData]>(this);


	public entitys: Entity[] = [];

	public draw_mode: 'height' | 'height+demp' = 'height';

	public height_map = generatePerlinNoise(W, H, {
		seed: SEED_HEIGHT_MAP, amplitude: 0.1, octaveCount: 6, persistence: 0.5
		// seed: 0x6147db, amplitude: 0.1, octaveCount: 7, persistence: 0.3
		// seed: 0x6147db, amplitude: 0.1, octaveCount: 5, persistence: 0.3
	}).map(it => 0.4 < it && it < 0.6 ? it :
		Math.clamp(0, it < 0.5 ? (1/2**1.5) * (2*it)**1 : (1/2**0.7) * (2*it)**1, 1));

	public resources_map = generatePerlinNoise(W, H, {
		seed: SEED_HEIGHT_MAP, amplitude: 0.5, octaveCount: 4, persistence: 0.7
	// }).map(it => Math.clamp(0, it-0.5, 1) + 0.5);
	}).map(it => it > 0.9 ? it : 0);

	public insert<T extends Entity>(o: T): T {
		this.entitys.push(o);
		this['@insert'].emit(o);
		return o;
	}
	public remove<T extends Entity>(o: T): T | void {
		const l = this.entitys.indexOf(o);

		if(~l) {
			this['@remove'].emit(o);
			return this.entitys.splice(l, 1)[0] as T;
		}
	}

	public create<const T extends AnyModuleId[]>(cell: Vector2, Modules: T, p: EntityParams<T>): Entity<T> {
		const o = new Entity(cell, Modules, p);

		this.entitys.push(o);
		this['@create'].emit(o);
		this.insert(o);

		return o;
	}
	public delete<T extends Entity>(o: T): T | void {
		const l = this.entitys.indexOf(o);

		if(~l) {
			this['@delete'].emit(o);
			this.remove(o);
			return this.entitys.splice(l, 1)[0] as T;
		}
	}

	public communication_network = new Env.CommunicationNetwork();
	public electrical_network = new Env.ElectricalNetwork();
	public radar_scan_data = new WeakMap<Entity, IScanData>();

	public getObjectHeight<T extends Entity>(obj: T) { return this.height_map[I(obj.cell)]+obj.height; }


	public canvas_map = document.createElement('canvas').getContext('2d')!;

	public drawCalls(pos: Vector2, { height, resource }: Record<string, number>, ctx: Context2D) {
		if(this.draw_mode === 'height') {
			ctx.fillStyle = `hsl(30 50 ${height*100})`;
			if(resource) ctx.fillStyle = `hsla(0 100 ${height*80} / ${resource})`;
		}

		ctx.fillRect(pos.x, pos.y, 1, 1);
	}

	public mapRender(ctx = this.canvas_map) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		for(let i = 0; i < MAP_SIZE; i++) {
			const height = this.height_map[i];
			const resource = this.resources_map[i];

			const pos = XY(i);
			this.drawCalls(pos, { height, resource }, ctx);
		}
	}

	async #init(this: World): Promise<void> {
		if(this.height_map.some(it => it < 0)) throw new Error('height_map < 0');

		this.canvas_map.canvas.width = W;
		this.canvas_map.canvas.height = H;

		this.mapRender();

		this.on('create', entity => {
			const scan = entity.get('scan');

			if(scan) scan.on('scan', data => this.scanedRender(data));
		});
	}

	constructor() { super(); this.#init(); }


	public scaned_map = new OffscreenCanvas(W, H).getContext('2d')!;

	public scanedRender(data: IScanData, ctx = this.scaned_map) {
		ctx.save();
		// ctx.clearRect(0, 0, W, H);

		for(let i = 0; i < data.length; i++) {
			const { pos, cell } = data[i];
			this.drawCalls(pos.new().add(W/2, H/2), cell, ctx);
		}

		ctx.restore();
	}

	public update(dt: number): void {
		for(let i = 0; i < this.entitys.length; i++) this.entitys[i].update(dt);
	}
}
