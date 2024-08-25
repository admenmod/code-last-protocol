import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import type { Viewport } from 'ver/Viewport';
import { Loader } from 'ver/Loader';
import { Node2D } from './Node2D.js';


type Image = InstanceType<typeof Image>;


export class Sprite extends Node2D {
	#image?: Image;
	public get image() { return this.#image; }
	public set image(v) {
		this.#image = v;
		this.size.set(this.width, this.height);
	}

	public get src() { return this.image?.src || ''; }
	public get width() { return this.image?.naturalWidth || 0; }
	public get height() { return this.image?.naturalHeight || 0; }

	public offset = new Vector2();
	public offset_angle: number = 0;
	public size: Vector2 = new Vector2(0, 0, vec => (this.draw_distance = this.globalScale.inc(this.size).module, vec));

	public async load(...args: Parameters<Loader['loadImage']>): Promise<void> {
		this.image = await Loader.instance().loadImage(...args);
	}

	#frame: [] | [x: number, y: number, w: number, h: number] = [];
	public get frame() { return this.#frame; }
	public set frame(v: [] | [x: number, y: number, w: number, h: number] | {
		x: number, y: number, w: number, h: number
	}) {
		if('x' in v) v = [v.x, v.y, v.w, v.h];

		this.#frame = v;
		if(!v.length) this.size.set(this.width, this.height);
		else  this.size.set(v[2], v[3]);
	}

	public invertX: boolean = false;
	public invertY: boolean = false;

	protected override _draw({ ctx }: Viewport): void {
		if(!this.image) return;

		if(this.invertX) ctx.scale(-1, 1);
		if(this.invertY) ctx.scale(1, -1);

		if(this.offset_angle !== 0) ctx.rotate(this.offset_angle);

		ctx.drawImage(this.image, ...this.frame as [],
			this.offset.x - this.size.x/2, this.offset.y -this.size.y/2,
			this.size.x, this.size.y);
	}
}
