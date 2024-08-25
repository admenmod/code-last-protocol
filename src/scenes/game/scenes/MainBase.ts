import type { Viewport } from 'ver/Viewport';

import { Structure } from './Structure';
import { CELL_SIZE } from '@/config';


export class MainBase extends Structure {
	protected override async _init(this: Structure): Promise<void> {
		await super._init();

		this.title = 'Main base';
		this.size.set(4 * CELL_SIZE);
	}

	protected override _draw({ ctx }: Viewport): void {
		const size = this.size;

		ctx.fillStyle = '#eeeeaa';
		ctx.fillRect(-size.x/2, -size.y/2, size.x, size.y);

		ctx.font = `${15}px Arial`;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillStyle = '#113311';
		ctx.fillText('Base', 0, 0);
	}
}
