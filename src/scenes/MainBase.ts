import { Vector2 } from 'ver/Vector2';
import type { Viewport } from 'ver/Viewport';

import { Structure } from '@/world/structure';
import { CELL_SIZE } from '@/config';


export class MainBase extends Structure {
	constructor(cell: Vector2) {
		super('Main base', cell, new Vector2().set(4));
	}

	public override draw({ ctx }: Viewport, pos: Vector2): void {
		const size = this.size.new().inc(CELL_SIZE);

		ctx.fillStyle = '#eeeeaa';
		ctx.fillRect(pos.x - size.x/2, pos.y - size.y/2, size.x, size.y);

		ctx.font = `${15}px Arial`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#113311';
		ctx.fillText('Base', pos.x, pos.y);
	}
}
