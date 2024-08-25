import type { Viewport } from 'ver/Viewport';
import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';

import { Node2D } from '../Node2D.js';


export class GridMap extends Node2D {
	public scroll = new Vector2();

	public tile = new Vector2(50, 50);
	public tile_scale = new Vector2(1, 1);
	public tile_offset = new Vector2(0, 0, vec => {
		this.tile_offset[0] = Math.clamp(-this.tile.x, vec.x, this.tile.x);
		this.tile_offset[1] = Math.clamp(-this.tile.y, vec.y, this.tile.y);
	});

	public size = new Vector2(0, 0, vec => this.draw_distance = vec.module);
	public offset = new Vector2();
	public override scale = new Vector2(1, 1);

	public padding = new Vector2(5, 5);

	public lineWidth: number = 0.2;
	public lineColor: string = '#ffffff';

	public coordinates: boolean = false;
	public fontSize: number = 10;
	public fontUnit: string = 'px';
	public fontFamily: string = 'monospace';

	constructor() {
		super();

		this.size.set(350, 200);
	}

	protected override _draw({ ctx, scale }: Viewport): void {
		const size = this.size.new();
		const zero = size.new().div(2).invert().add(this.offset);
		const tile = this.tile.new().inc(this.tile_scale);

		const scroll = this.scroll.new().add(this.tile_offset.new().inc(this.tile_scale)).add(this.offset);
		const counts = size.new().div(tile).div(2).add(1).ceilToZero();


		// clip area
		ctx.beginPath();
		ctx.rect(zero.x, zero.y, size.x, size.y);
		ctx.clip();


		// draw grid
		ctx.beginPath();
		if(this.lineWidth < 1) {
			ctx.globalAlpha = this.lineWidth;
			ctx.lineWidth = 1 * scale.x;
		} else ctx.lineWidth = this.lineWidth * scale.x;

		ctx.strokeStyle = this.lineColor;


		for(let dx = -counts.x; dx < counts.x; dx++) {
			const x = dx*tile.x - scroll.x%tile.x + this.offset.x;
			ctx.moveTo(x, zero.y);
			ctx.lineTo(x, zero.y + size.y);
		}

		for(let dy = -counts.y; dy < counts.y; dy++) {
			const y = dy*tile.y - scroll.y%tile.y + this.offset.y;
			ctx.moveTo(zero.x, y);
			ctx.lineTo(zero.x + size.x, y);
		}

		ctx.stroke();


		// area stroke
		ctx.beginPath();
		ctx.strokeStyle = '#44ff44';
		ctx.strokeRect(zero.x, zero.y, size.x, size.y);


		// coordinates
		if(this.coordinates) {
			const pad = this.padding;

			ctx.beginPath();
			ctx.fillStyle = '#ffff00';
			ctx.globalAlpha = 0.4;
			ctx.font = `${this.fontSize * scale.y}${this.fontUnit} ${this.fontFamily}`;
			ctx.textAlign = 'left';
			ctx.textBaseline = 'top';

			for(let dx = -counts.x; dx < counts.x; dx++) {
				const coord = (Math.floorToZero(scroll.x/tile.x) + dx) * tile.x;
				ctx.fillText(coord.toFixed(0), (dx*tile.x - scroll.x%tile.x) + (this.offset.x+pad.x), zero.y+pad.y);
			}

			for(let dy = -counts.y; dy < counts.y; dy++) {
				const coord = (Math.floorToZero(scroll.y/tile.y) + dy) * tile.y;
				ctx.fillText(coord.toFixed(0), zero.x+pad.x, (dy*tile.y - scroll.y%tile.y) + (this.offset.y+pad.y));
			}
		}
	}
}
