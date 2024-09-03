import { math as Math } from 'ver/helpers';
import { Vector2 } from 'ver/Vector2';
import { Viewport } from 'ver/Viewport';

import { Node2D } from 'lib/scenes/Node2D';
import { CELL_SIZE } from '@/config';
import { generatePerlinNoise } from '@vicimpa/perlin-noise';


export const W = 128, H = 128;
export const MAP_SIZE = W * H;
export const SIZE_X = CELL_SIZE*W, SIZE_Y = CELL_SIZE*H; 

export const I = (v: Vector2) => (v.x+W/2) + (v.y+H/2) * W;
export const XY = (i: number) => new Vector2(i % W, Math.floor(i/W));

const seedR = 0x1d1f10;
// const seedG = 0x1aa80b;
// const seedB = 0x8a2864;

const SEED_HEIGHT_MAP = 0x6147db;

export class WorldMap extends Node2D {
	public draw_mode: 'height' | 'height+demp' = 'height';

	public height_map = generatePerlinNoise(W, H, {
		seed: SEED_HEIGHT_MAP, amplitude: 0.1, octaveCount: 7, persistence: 0.5
		// seed: 0x6147db, amplitude: 0.1, octaveCount: 7, persistence: 0.3
	});
	//.map(it => 1-Math.clamp(0, Math.round(it*20)/20, 1));
	// }).map(it => Math.clamp(0, (it-0.5) * 6, 1));
	// }).map(it => Math.clamp(0, (it+1) ** 2 - 1, 1));

	public canvas_map = document.createElement('canvas').getContext('2d')!;

	protected override async _init(): Promise<void> {
		if(this.height_map.some(it => it < 0)) throw new Error('height_map < 0');

		this.draw_distance = W * H;

		this.canvas_map.canvas.width = W;
		this.canvas_map.canvas.height = H;

		this.mapRender();
	}

	public mapRender(ctx = this.canvas_map) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

		for(let i = 0; i < MAP_SIZE; i++) {
			const pos = XY(i);

			const height = this.height_map[i];

			if(this.draw_mode === 'height') ctx.fillStyle = `hsl(${height*360} 100 50)`;
			else if(this.draw_mode === 'height+demp') ctx.fillStyle = `hsl(0 0 ${height*100})`;

			ctx.fillRect(pos.x, pos.y, 1, 1);
		}
	}

	protected override _draw({ ctx, size, scale }: Viewport): void {
		ctx.fillStyle = '#000000';
		ctx.fillRect(-SIZE_X/2, -SIZE_Y/2, SIZE_X, SIZE_Y);

		ctx.imageSmoothingEnabled = false;
		ctx.globalAlpha = 0.2;
		ctx.drawImage(this.canvas_map.canvas, -SIZE_X/2, -SIZE_Y/2, SIZE_X, SIZE_Y);
		ctx.globalAlpha = 1;
	}
}
