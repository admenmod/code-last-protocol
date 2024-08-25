import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import type { Viewport } from 'ver/Viewport';
import { Control } from '../Control.js';


export class Button extends Control {
	public '@click' = new Event<Button, []>(this);
	public '@pressed' = new Event<Button, []>(this);
	public '@up' = new Event<Button, []>(this);


	protected _text: string = '';
	public get text() { return this._text; }
	public set text(v) { this._text = v; }

	public readonly size = new Vector2(120, 30, vec => this.draw_distance = vec.module);


	public style: Partial<CSSStyleRule['style']> = {};

	protected override async _init(this: Button): Promise<void> {
		await super._init();

		this.on('input:click', ({ pos, touch }) => {
			if(touch.clickCount !== 1) return;

			const position = this.globalPosition;
			const size = this.globalScale.inc(this.size);

			if(
				pos.x < position.x + size.x/2 && pos.x > position.x - size.x/2 &&
				pos.y < position.y + size.y/2 && pos.y > position.y - size.y/2
			) this['@click'].emit();
		});

		this.on('input:press', ({ pos }) => {
			const position = this.globalPosition;
			const size = this.globalScale.inc(this.size);

			if(
				pos.x < position.x + size.x/2 && pos.x > position.x - size.x/2 &&
				pos.y < position.y + size.y/2 && pos.y > position.y - size.y/2
			) this['@pressed'].emit();
		});

		this.on('input:up', ({ pos }) => {
			const position = this.globalPosition;
			const size = this.globalScale.inc(this.size);

			if(
				pos.x < position.x + size.x/2 && pos.x > position.x - size.x/2 &&
				pos.y < position.y + size.y/2 && pos.y > position.y - size.y/2
			) this['@up'].emit();
		});
	}

	protected override _draw({ ctx }: Viewport): void {
		ctx.beginPath();
		ctx.fillStyle = this.style.background || '#222222';
		ctx.fillRect(-this.size.x/2, -this.size.y/2, this.size.x, this.size.y);

		ctx.beginPath();
		ctx.strokeStyle = this.style.borderColor || '#339933';
		ctx.strokeRect(-this.size.x/2, -this.size.y/2, this.size.x, this.size.y);

		ctx.beginPath();
		ctx.fillStyle = this.style.color || '#eeeeee';
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.font = `${this.style.fontSize || '15px'} ${this.style.fontFamily || 'arkhip,monospace'}`;
		ctx.fillText(this._text, 0, 0);
	}
}
