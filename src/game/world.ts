import { Vector2 } from 'ver/Vector2';
import { Event, EventDispatcher } from 'ver/events';
import { math as Math } from 'ver/helpers';

import '@/modules/BuildModule';
import '@/modules/CargoModule';
import '@/modules/ExtractModule';
import '@/modules/MoveModule';
import '@/modules/ScanModule';
import '@/modules/ScriptModule';

import { Env } from '@/game/Env';
import { Entity } from './Entity';
import type { IScanData } from '@/game/types';


import { CELL_SIZE } from '@/config';
import { type AnyModuleId, type EntityParams } from '@/modules';
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';


type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;


interface TerrainParams {
	octaves: number;    // Количество октав
	scale: number;      // Масштаб (чем больше, тем крупнее объекты)
	lacunarity: number; // Увеличение частоты после каждой октавы (обычно 2.0)
	gain: number;       // Снижение амплитуды после каждой октавы (обычно 0.4–0.6)
	amplitude: number;  // умножение выходных значений
	frequency: number;  // умнодение входных значений
}

// Функция возвращает высоту в диапазоне [0, 1] для координат (x, y)
export function getHeightAt(x: number, y: number, noise2D: (x: number, y: number) => number, {
	octaves = 5,
	scale = 40,
	lacunarity = 2.0,
	gain = 0.5,
	amplitude = 1,
	frequency = 1
}: Partial<TerrainParams> = {}): number {
	let elevation = 0;
	let maxValue = 0;

	for(let o = 0; o < octaves; o++) {
		const nx = x * frequency / scale;
		const ny = y * frequency / scale;
		elevation += noise2D(nx, ny) * amplitude;
		maxValue += amplitude;

		amplitude *= gain;
		frequency *= lacunarity;
	}

	// Приводим результат к диапазону [0, 1]
	return (elevation / maxValue + 1) / 2;
}


function generatePerlinNoise(seed: number, w: number, h: number, {
	octaves = 5,
	scale = 40,
	lacunarity = 2.0,
	gain = 0.5,
	amplitude = 1,
	frequency = 1
}: Partial<TerrainParams> = {}, c: (it: number) => number = it => it) {
	const arr = new Array(w * h);
	const noise2D = createNoise2D(alea(seed));

	for(let i = 0; i < arr.length; i++) {
		const value = getHeightAt(XY(i).x, XY(i).y, noise2D, { octaves, scale, lacunarity, gain, amplitude, frequency });

		arr[i] = c(value);
	}

	return arr;
}

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

	public height_map = generatePerlinNoise(SEED_HEIGHT_MAP, W, H, {
		amplitude: 1, lacunarity: 1.7, octaves: 6, gain: 0.4, scale: 80
	}, it => 0.4 < it && it < 0.6 ? it : Math.clamp(0, it < 0.5 ? (1/2**1.5) * (2*it)**1 : (1/2**0.7) * (2*it)**1, 1));

	public resources_map = generatePerlinNoise(SEED_HEIGHT_MAP, W, H, {
		amplitude: 0.5, octaves: 4, gain: 0.7
	// }).map(it => Math.clamp(0, it-0.5, 1) + 0.5);
	}, it => it > 0.9 ? it : 0);

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
		const o = new Entity<T>(cell, Modules, p);

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
