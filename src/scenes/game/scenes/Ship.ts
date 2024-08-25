import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import { State } from 'ver/State';
import { math as Math } from 'ver/helpers';
import { Animation } from 'ver/Animation';
import type { Viewport } from 'ver/Viewport';

import { Node2D } from 'lib/scenes/Node2D';
import { PhysicsItem } from 'lib/scenes/PhysicsItem';
import { c } from '@/animations';


export class Ship extends PhysicsItem {
	public '@HP' = new Event<Ship, [last: number, prev: number]>(this);

	private _HP: number = 0;
	public get HP() { return this._HP; }
	public set HP(v) {
		v = Math.clamp(0, v, Math.INF);

		if(this._HP === v) return;

		const prev = this._HP;
		this._HP = v;
		this['@HP'].emit(this._HP, prev);
	}

	protected override async _init(): Promise<void> {
		this.type_body = 'dynamic';

		this.HP = 100;
	}

	protected override _ready(): void {
		;
	}

	protected override _process(dt: number): void {
		;
	}


	protected override _draw({ ctx }: Viewport): void {
		ctx.strokeStyle = '#eeaa77';
		ctx.beginPath();
		ctx.moveTo(0, -10);
		ctx.lineTo(5, 10);
		ctx.lineTo(-5, 10);
		ctx.closePath();
		ctx.stroke();

		ctx.fillStyle = '#eeaa77';
		ctx.beginPath();
		ctx.moveTo(0, -10);
		ctx.lineTo(5, 10);
		ctx.lineTo(-5, 10);
		ctx.closePath();
		ctx.fill();
	}
}
