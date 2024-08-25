import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';
import { Node2D } from '../Node2D.js';


export class SystemInfo extends Node2D {
	public textFPS: string = '';

	public padding = new Vector2(10, 10);
	public time: number = 0;
	public fpsacc: number = 0;
	public fpsi: number = 0;

	public stats: Record<string, string> = {};

	protected override async _init(): Promise<void> {
		this.zIndex = 1000;

		this.positionAsRelative = false;
		this.rotationAsRelative = false;
		this.scaleAsRelative = false;

		this.draw_distance = Math.INF;
	}

	protected override _process(dt: number) {
		if(this.time > 500) {
			this.textFPS = `FPS: ${(this.fpsacc/this.fpsi).toFixed(2)}`;

			this.fpsi = 0;
			this.fpsacc = 0;
			this.time = 0;
		}

		this.fpsi += 1;
		this.fpsacc += 1000/dt;
		this.time += dt;
	}

	protected override _draw({ ctx, size, position, pixelRatio }: Viewport): void {
		ctx.resetTransform();
		ctx.scale(pixelRatio, pixelRatio);

		const fontSize = 15;
		ctx.beginPath();
		ctx.textAlign = 'right';
		ctx.textBaseline = 'top';
		ctx.font = `${fontSize}px monospace`;
		ctx.strokeStyle = '#111111';
		ctx.strokeText(`${position.x.toFixed(0)}`, size.x - this.padding.x, this.padding.y);
		ctx.strokeText(`${position.y.toFixed(0)}`, size.x - this.padding.x, this.padding.y + fontSize);
		ctx.fillStyle = '#eeeeee';
		ctx.fillText(`${position.x.toFixed(0)}`, size.x - this.padding.x, this.padding.y);
		ctx.fillText(`${position.y.toFixed(0)}`, size.x - this.padding.x, this.padding.y + fontSize);

		ctx.beginPath();
		ctx.textAlign = 'left';
		ctx.textBaseline = 'top';
		ctx.font = `15px arkhip, Arial`;

		const space = 15;
		const offset_stats = 100;
		let i = 0;
		for(const id in this.stats) {
			ctx.strokeStyle = '#111111';
			ctx.strokeText(this.stats[id], this.padding.x, offset_stats + this.padding.y + i * space);
			ctx.fillStyle = '#eeeeee';
			ctx.fillText(this.stats[id], this.padding.x, offset_stats + this.padding.y + i * space);

			i += 1;
		}


		ctx.font = `18px arkhip, Arial`;
		ctx.strokeStyle = '#111111';
		ctx.strokeText(this.textFPS, this.padding.x, this.padding.y);
		ctx.fillStyle = '#eeeeee';
		ctx.fillText(this.textFPS, this.padding.x, this.padding.y);


		ctx.textAlign = 'end';
		ctx.textBaseline = 'bottom';
		ctx.strokeStyle = '#111111';
		ctx.strokeText(`Screen size: ${size.x.toFixed(0)}, ${size.y.toFixed(0)}`, size.x-10, size.y-10);

		ctx.fillStyle = '#eeeeee';
		ctx.fillText(`Screen size: ${size.x.toFixed(0)}, ${size.y.toFixed(0)}`, size.x-10, size.y-10);

		const center = new Vector2().set(size).div(2);
		const a = 5;

		ctx.beginPath();
		ctx.strokeStyle = '#444444';
		ctx.lineWidth = 0.1;
		ctx.moveTo(center.x, center.y-a);
		ctx.lineTo(center.x, center.y+a);
		ctx.moveTo(center.x-a, center.y);
		ctx.lineTo(center.x+a, center.y);
		ctx.stroke();
	}
}
