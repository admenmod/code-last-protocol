import { Vector2 } from 'ver/Vector2';
import { Event, FunctionIsEvent } from 'ver/events';
import { math as Math } from 'ver/helpers';
import { KeyboardInputInterceptor } from 'ver/KeyboardInputInterceptor';
import { KeymapperOfActions, MappingsMode } from 'ver/KeymapperOfActions';


export const Caret = Vector2;
export type Caret = Vector2;


export const pasteToInput = (input: HTMLInputElement | HTMLTextAreaElement, text: string) => {
	const { value, selectionStart, selectionEnd } = input;
	input.value = value.substring(0, selectionStart!) + text + value.substring(selectionEnd!);
	input.selectionStart = input.selectionEnd = selectionStart! + text.length;
};

export const paste = (value: string, text: string, start: number, end: number = start) => {
	return value.substring(0, start) + text + value.substring(end);
};


export class CodeEditor extends KeyboardInputInterceptor {
	public get mode() { return this.keymapperOfActions.mode; }

	public normal_mode = new MappingsMode('normal');
	public insert_mode = new MappingsMode('insert', () => false);

	public keymapperOfActions = new KeymapperOfActions(this.normal_mode);

	public lines: string[] = [''];

	public carets: Caret[] = [new Caret(0, 0, vec => {
		vec[1] = Math.clamp(0, vec.y, this.lines.length-1);
		vec[0] = Math.clamp(0, vec.x, this.lines[vec.y].length);
	})];

	constructor() {
		super({ preventDefault: true });

		this['@init'].on(input => document.querySelector('#app')!.append(input))
		this['@destroy'].on(input => input.remove());

		this.keymapperOfActions.init(this);

		this['@keyup:input'].on(e => {
			if(e.key === 'ArrowLeft') return this.carets[0].x -= 1;
			if(e.key === 'ArrowRight') return this.carets[0].x += 1;
			if(e.key === 'ArrowUp') return this.carets[0].y -= 1;
			if(e.key === 'ArrowDown') return this.carets[0].y += 1;

			if(this.keymapperOfActions.mode === this.normal_mode.mode) {
				if(e.key === 'i') return this.keymapperOfActions.setMode(this.insert_mode);
				if(e.key === 'a') {
					this.keymapperOfActions.setMode(this.insert_mode);
					this.carets[0].x += 1;
					return;
				}

				if(e.key === 'Backspace') return this.carets[0].x -= 1;
			}

			if(this.keymapperOfActions.mode === this.insert_mode.mode) {
				if(e.key === 'Escape') return this.keymapperOfActions.setMode(this.normal_mode);
				if(e.key === 'Backspace') return this.editLine(this.carets[0], '', -1);
				if(e.key === 'Enter') return this.edit(this.carets[0], '\n');

				this.editLine(this.carets[0], e.data);
			}
		});

		this.keymapperOfActions.enable();
	}


	public edit: FunctionIsEvent<null, [], (caret: Caret, str: string) => void> =
	new FunctionIsEvent(null, (caret, str) => {
		const lines = str.split(/(\n)/).filter(Boolean);
		this.lines.splice(caret.y+1, 0, ...lines);
		this.carets[0].y += lines.length;
	});


	public setText(text: string): void {
		this.lines.length = 0;
		this.lines = text.split('\n');
	}

	public getText(rows?: [number, number], colums?: [number, number]): string { return this.lines.join('\n'); }

	public editLine(caret: Caret, text: string, r: number = 0): void {
		const line = caret.y = Math.clamp(0, caret.y, this.lines.length-1);
		const row = this.lines[line];
		const pos = caret.x = Math.clamp(0, caret.x, row.length);

		if(r < 0) {
			this.lines[line] = paste(row, text, pos+r, pos);
			caret.x += text.length+r;
		} else {
			this.lines[line] = paste(row, text, pos, pos+r);
			caret.x += text.length;
		}


		this.edit.emit();
	}


	public override init(): this {
		if(this.isInited) return this;

		const input = document.createElement('textarea');
		input.style.cssText = `position: fixed; top: -1000vw;`;

		return super.init(input);
	}

	public override destroy(): this {
		if(!this.isInited) return this;
		this.input!.remove();

		return super.destroy();
	}


	public update(dt: number) {
		this.keymapperOfActions.update(dt);
	}
}
