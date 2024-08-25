import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';
import type { Touch } from 'ver/TouchesController';

import { Control } from '../Control.js';


export class Joystick extends Control {
	public speed_reset: number = 3;

	public core_offset = new Vector2();

	public radius0: number = 70;
	public coreRadius0: number = 50;
	public colors0 = [0, '#112233', 1, '#223344'];

	public radius1: number = 30;
	public coreRadius1: number = 5;
	public colors1 = [0, '#223344', 1, '#112233'];

	private _angle: number = 0;
	public angle_offset: number = 0;

	public touch: Touch | null = null;

	public get value(): number { return Math.floor(this.core_offset.module / (this.radius0-this.radius1) * 1e6)/1e6; }
	public get angle(): number {
		return this._angle = this.value ? Math.mod(this.core_offset.angle + this.angle_offset) : this._angle;
	}


	protected override async _init(this: Joystick): Promise<void> {
		this.on('input:press', ({ pos: tpos, touch }) => {
			const pos = this.globalPosition;
			const l = pos.getDistance(tpos) / this.globalScale.x;

			if(!this.touch && l < this.radius0) this.touch = touch;

			if(this.touch === touch) {
				this.core_offset.set(new Vector2().moveAngle(
					Math.min(l, this.radius0-this.radius1),
					pos.getAngleRelative(tpos)
				));
			}
		});

		this.on('input:up', ({ touch }) => {
			if(this.touch === touch) this.touch = null;
		});

		this.on('input:move', ({ pos: tpos, touch }) => {
			if(this.touch !== touch) return;

			const pos = this.globalPosition;
			const l = pos.getDistance(tpos) / this.globalScale.x;

			this.core_offset.set(new Vector2().moveAngle(
				Math.min(l, this.radius0-this.radius1),
				pos.getAngleRelative(tpos)
			));
		});
	}

	protected override _process(): void {
		if(!this.touch) this.core_offset.moveTime(Vector2.ZERO, this.speed_reset);
	}

	protected override _draw(viewport: Viewport): void {
		const ctx = viewport.ctx;

		ctx.globalAlpha = 0.7;
		ctx.beginPath();

		let grd = ctx.createRadialGradient(0, 0, this.coreRadius0, 0, 0, this.radius0);

		for(let i = 0; i < this.colors0.length; i += 2) {
			grd.addColorStop(this.colors0[i] as number, this.colors0[i+1] as string);
		}

		ctx.fillStyle = grd;
		ctx.arc(0, 0, this.radius0, 0, Math.PI*2);
		ctx.fill();

		ctx.beginPath();
		grd = ctx.createRadialGradient(
			this.core_offset.x, this.core_offset.y, this.coreRadius1,
			this.core_offset.x, this.core_offset.y, this.radius1
		);

		for(let i = 0; i < this.colors1.length; i += 2) {
			grd.addColorStop(this.colors1[i] as number, this.colors1[i+1] as string);
		}

		ctx.fillStyle = grd;
		ctx.arc(this.core_offset.x, this.core_offset.y, this.radius1, 0, Math.PI*2);
		ctx.fill();
	}
}
