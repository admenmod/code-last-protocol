import { LitElement, css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { UPDATE, react } from './core';


const TAG_NAME = 'q-textarea';

export @customElement(TAG_NAME) class QTextarea extends LitElement {
	public [UPDATE]() { this.requestUpdate(); }

	@react public value(next = '') { return next; }

	@query('textarea') private _textarea?: HTMLTextAreaElement;

	public override render() {
		return html`<textarea
			.value=${this.value() || this.innerText}
			@input=${() => this.value(this._textarea!.value)}
		></textarea>`;
	}

	public static override styles = css``;
}

declare global {
	interface HTMLElementTagNameMap {
		[TAG_NAME]: QTextarea;
	}
}
