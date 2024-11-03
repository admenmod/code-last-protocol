import { Event } from 'ver/events';
import { LitElement, css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { UPDATE, react } from './core';
import { Terminal } from '@/code/Terminal';
import { delay } from 'ver/helpers';
import { List } from 'ver/List';


const TAG_NAME = 'q-terminal';

export @customElement(TAG_NAME) class QTerminal extends LitElement {
	public '@update' = new Event<QTerminal, []>(this);


	public [UPDATE]() { this.requestUpdate(); }

	@property({ type: String }) public value = '';
	@property({ type: String }) public logs	= '';

	#terminal!: Terminal;
	@property() public set terminal(v) {
		this.#terminal?.off('update', 'q-terminal');
		this.#terminal = v;
		this.#terminal.on('update', () => this['@update'].emit(), 0, 'q-terminal');

		this['@update'].emit();
	}
	public get terminal() { return this.#terminal; }

	constructor() {
		super();

		this['@update'].on(() => {
			this.c = 0;
			this.value = '';
			this.logs = this.terminal.logs.join('\n');
			delay(0, () => this._logs!.scrollTop = this._logs!.scrollHeight);
		});
	}

	@query('input') private _input?: HTMLInputElement;
	@query('.logs') private _logs?: HTMLPreElement;
	@query('.scroll-point') private _scroll_point?: HTMLDivElement;

	public c: number = 0;

	public override render() {
		return html`<pre class="logs" .textContent=${this.logs} style="
			padding: 5px 10px;
			overflow: scroll;
			max-height: 25vh;
			background: #33333380;
		"><div class="scroll-point"></div></pre>
		<input inputmode="search" .value=${this.value} style="
			padding: 5px 10px;
			font-family: monospace;
			color: #44ee77;
			background: #33333380;
		" @input=${() => this.value = this._input!.value} @keyup=${(e: KeyboardEvent) => {
			if(e.key === 'Enter') this.terminal.write(this.value);

			const history = this.terminal.history;
			if(!history) return;

			if(e.key === 'ArrowUp') {
				if(history.length > this.c + 1) this.value = history[history.length - ++this.c] || '';
				console.log(history.length, this.c, history.length - this.c);
			}
			if(e.key === 'ArrowDown') {
				if(0 <= this.c - 1) this.value = history[history.length - --this.c] || '';
				console.log(history.length, this.c, history.length - this.c);
			}
		}} />`;
	}

	public static override styles = css``;
}

declare global {
	interface HTMLElementTagNameMap {
		[TAG_NAME]: QTerminal;
	}
}
