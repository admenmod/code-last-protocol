import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import { type Parameters, math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';

import { CELL_SIZE } from '@/config';
import { Node2D } from 'lib/scenes/Node2D';
import { Structure } from '@/world/structure';


export class StructuresL extends Node2D {
	public '@create' = new Event<StructuresL, [o: Structure]>(this);


	public items: Structure[] = [];

	public create<const T extends new (...args: any) => Structure>(Class: T, ...args: Parameters<T>): InstanceType<T> {
		const o = new Class(...args);
		this['@create'].emit(o);
		this.items.push(o);
		return o as InstanceType<T>;
	}

	protected override async _init(): Promise<void> {
		await super._init();

		this.draw_distance = Math.INF;
	}

	protected override _draw(viewport: Viewport): void {
		const { ctx } = viewport;

		for(let i = 0; i < this.items.length; i++) {
			const item = this.items[i];
			const pos = item.cell.new().inc(CELL_SIZE);
			if(item.size.x % 2) pos.x += CELL_SIZE/2;
			if(item.size.y % 2) pos.y += CELL_SIZE/2;
			const rot = Math.TAU/8 * item.diration;

			ctx.save();

			ctx.translate(pos.x, pos.y);
			ctx.rotate(rot);
			ctx.translate(-pos.x, -pos.y);

			item.draw(viewport, pos);

			ctx.restore();
		}
	}

	public get [Symbol.toStringTag]() { return 'StructuresL'; }
}
