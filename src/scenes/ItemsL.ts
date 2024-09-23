import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import { math as Math, Parameters } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';

import { Node2D } from 'lib/scenes/Node2D';
import { Item } from '@/world/item';

import { dirToVec2, TDiration } from '@/utils/cell';
import { CELL_SIZE } from '@/config';


export class ItemsL extends Node2D {
	public '@create' = new Event<ItemsL, [o: Item]>(this);


	public items: Item[] = [];

	public create<const T extends new (...args: any) => Item>(Class: T, ...args: Parameters<T>): InstanceType<T> {
		const o = new Class(...args);
		this['@create'].emit(o);
		this.items.push(o);
		return o as InstanceType<T>;
	}

	protected override async _init(): Promise<void> {
		await super._init();

		this.draw_distance = Math.INF;
	}

	protected override _process(dt: number): void {
		;
	}

	protected override _draw(viewport: Viewport): void {
		const { ctx } = viewport;

		for(let i = 0; i < this.items.length; i++) {
			const item = this.items[i];
			const pos = item.cell.new().inc(CELL_SIZE).add(CELL_SIZE/2);
			const rot = Math.TAU/8 * item.diration;

			ctx.save();

			ctx.translate(pos.x, pos.y);
			ctx.rotate(rot);
			ctx.translate(-pos.x, -pos.y);

			item.draw(viewport, pos);

			ctx.restore();
		}
	}
}
