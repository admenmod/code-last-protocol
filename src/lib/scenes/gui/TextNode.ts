import { Vector2 } from 'ver/Vector2';
import { Viewport } from 'ver/Viewport';
import { Node2D } from '../Node2D.js';


export class TextNode extends Node2D {
	protected _lines: string[] = [''];
	public get lines() { return this._lines; }

	protected _text: string = '';
	public get text() { return this._text; }
	public set text(v) {
		this._text = v;
		this._lines.length = 0;
		this._lines.push(...this.text.split('\n'));
	}

	public style: {
		font: string;
		color: string;
		textAlign: CanvasTextAlign;
		textBaseline: CanvasTextBaseline;
	} = {
		font: '15px arkhip',
		color: '#eeeeee',
		textAlign: 'center',
		textBaseline: 'middle'
	};

	protected linespace: number = 15;


	protected override _draw({ ctx }: Viewport): void {
		ctx.beginPath();
		ctx.font = this.style.font;
		ctx.fillStyle = this.style.color;
		ctx.textAlign = this.style.textAlign;
		ctx.textBaseline = this.style.textBaseline;

		const linespace = this.linespace;

		for(let i = 0; i < this._lines.length; i++) {
			ctx.fillText(this._lines[i], 0, linespace * i);
		}

		ctx.restore();
	}
}
