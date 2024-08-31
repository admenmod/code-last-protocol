import { Vector2 } from 'ver/Vector2';
import { Viewport } from 'ver/Viewport';
import { CELL_SIZE } from '@/config';
import { Structure } from './structure';


export class Resource extends Structure {
	public override draw({ ctx }: Viewport, pos: Vector2): void {
		const size = this.size.new().inc(CELL_SIZE);
		ctx.fillStyle = '#ee2222';
		ctx.fillRect(pos.x - size.x/2, pos.y - size.y/2, size.x, size.y);
	}
}
