import { math as Math } from 'ver/helpers';
import { Vector2 } from 'ver/Vector2';
import { Viewport } from 'ver/Viewport';
import { Node2D } from 'lib/scenes/Node2D';
import { CELL_SIZE } from '@/config';
import { generatePerlinNoise } from '@vicimpa/perlin-noise';


const W = 128, H = 128;
const MAP_SIZE = W * H;
const SIZE_X = CELL_SIZE*W, SIZE_Y = CELL_SIZE*H; 

export const I = (v: Vector2) => v.x + v.y * W;
export const XY = (i: number) => new Vector2(i % W, Math.floor(i/W));

const seedR = 0x1d1f10;
// const seedG = 0x1aa80b;
// const seedB = 0x8a2864;

const SEED_HEIGHT_MAP = 0x6147db;

export class WorldMap extends Node2D {
	public ll: number = 0;

	public height_map = generatePerlinNoise(W, H, {
		seed: SEED_HEIGHT_MAP, amplitude: 0.1, octaveCount: 6, persistence: 0.5
	}).map(it => Math.clamp(0, (it - 0.5) * 2, 1));

	public demp_map = generatePerlinNoise(W, H, {
		seed: seedR, amplitude: 0.1, octaveCount: 6, persistence: 0.5
	});

	public canvas_map = document.createElement('canvas').getContext('2d')!;

	protected override async _init(): Promise<void> {
		this.draw_distance = W * H;

		this.canvas_map.canvas.width = W;
		this.canvas_map.canvas.height = H;

		this.mapRender();
	}

	public mapRender(ctx = this.canvas_map) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		for(let i = 0; i < MAP_SIZE; i++) {
			const pos = XY(i);

			const demp = this.demp_map[i];
			const height = (this.height_map[i] - this.ll) * 2;

			const r = 1 	* height * 255;
			const g = 1		* height * 255;
			const b = 1		* height * 255;

			ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
			ctx.fillRect(pos.x, pos.y, 1, 1);
		}
	}

	protected override _draw({ ctx, size, scale }: Viewport): void {
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(this.canvas_map.canvas, -SIZE_X/2, -SIZE_Y/2, SIZE_X, SIZE_Y);
	}
}
