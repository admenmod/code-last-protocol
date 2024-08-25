import { math as Math } from 'ver/helpers';
import { Vector2 } from 'ver/Vector2';
import { Viewport } from 'ver/Viewport';
import { Node2D } from 'lib/scenes/Node2D';
import { CELL_SIZE } from '@/config';
import { generatePerlinNoise } from '@vicimpa/perlin-noise';


const W = 128, H = 128;
const SIZE_X = CELL_SIZE*W, SIZE_Y = CELL_SIZE*H; 

export const I = (v: Vector2) => v.x + v.y * W;
export const XY = (i: number) => new Vector2(i % W, Math.floor(i/W));

const seedR = parseInt('1d1f10', 16);
const seedG = parseInt('1aa80b', 16);
const seedB = parseInt('8a2864', 16);

export class WorldMap extends Node2D {
	public arrR = generatePerlinNoise(W, H, {
		seed: seedR, amplitude: 0.1, octaveCount: 6, persistence: 0.5
	}).map(it => it*255);
	public arrG = generatePerlinNoise(W, H, {
		seed: seedG, octaveCount: 6, persistence: 0.5
	}).map(it => it*255);
	public arrB = generatePerlinNoise(W, H, {
		seed: seedB, octaveCount: 6, persistence: 0.5
	}).map(it => it*255);

	public canvas_map = document.createElement('canvas').getContext('2d')!;

	protected override async _init(): Promise<void> {
		this.draw_distance = W * H;

		this.canvas_map.canvas.width = W;
		this.canvas_map.canvas.height = H;

		this.mapRender();
	}

	public mapRender(ctx = this.canvas_map) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		// ctx.globalCompositeOperation = 'hue';
		ctx.globalAlpha = 0.3;

		for(let i = 0; i < this.arrR.length; i++) {
			const n = this.arrR[i];
			const pos = XY(i);

			ctx.fillStyle = `rgb(${n}, 0, 0)`;
			ctx.fillRect(pos.x, pos.y, 1, 1);
		}
		for(let i = 0; i < this.arrG.length; i++) {
			const n = this.arrG[i];
			const pos = XY(i);

			ctx.fillStyle = `rgb(0, ${n}, 0)`;
			ctx.fillRect(pos.x, pos.y, 1, 1);
		}
		for(let i = 0; i < this.arrB.length; i++) {
			const n = this.arrB[i];
			const pos = XY(i);

			ctx.fillStyle = `rgb(0, 0, ${n})`;
			ctx.fillRect(pos.x, pos.y, 1, 1);
		}
	}

	protected override _draw({ ctx, size, scale }: Viewport): void {
		ctx.imageSmoothingEnabled = false;
		ctx.drawImage(this.canvas_map.canvas, -SIZE_X/2, -SIZE_Y/2, SIZE_X, SIZE_Y);
	}
}
