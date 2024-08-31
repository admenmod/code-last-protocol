import { TDiration } from '@/utils/cell';
import { Vector2 } from 'ver/Vector2';
import { Viewport } from 'ver/Viewport';
import { Event, EventDispatcher } from 'ver/events';
import { math as Math } from 'ver/helpers';
import { CELL_SIZE } from '@/config';


export class Unit extends EventDispatcher {
	public '@move' = new Event<Unit, [pos: Vector2, prev: Vector2]>(this);

	#prev_cell = new Vector2;
	public readonly cell = new Vector2(0, 0, vec => this['@move'].emit(vec.new(), this.#prev_cell.new()));
	public readonly size = new Vector2(1, 1);


	public _diration: TDiration = 0;
	public get diration() { return this._diration; }
	public set diration(v) {
		this._diration = Math.mod(v, 0, 8) as TDiration;
	}


	constructor(cell: Vector2) { super();
		this.cell.set(cell);
	}

	public draw({ ctx }: Viewport, pos: Vector2) {
		ctx.strokeStyle = '#eeaa77';
		ctx.beginPath();
		ctx.moveTo(pos.x + -CELL_SIZE/2, pos.y);
		ctx.lineTo(pos.x + CELL_SIZE/2, pos.y + -CELL_SIZE/3);
		ctx.lineTo(pos.x + CELL_SIZE/2, pos.y + CELL_SIZE/3);
		ctx.closePath();
		ctx.stroke();

		ctx.fillStyle = '#eeaa77';
		ctx.beginPath();
		ctx.moveTo(pos.x + -CELL_SIZE/2, pos.y);
		ctx.lineTo(pos.x + CELL_SIZE/2, pos.y + -CELL_SIZE/3);
		ctx.lineTo(pos.x + CELL_SIZE/2, pos.y + CELL_SIZE/3);
		ctx.closePath();
		ctx.fill();
	}
}
