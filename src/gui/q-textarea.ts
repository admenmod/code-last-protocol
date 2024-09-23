import { LitElement, css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { ref } from 'lit/directives/ref.js';


const TAG_NAME = 'q-textarea';

export @customElement(TAG_NAME) class QTextarea extends LitElement {
	@query('textarea') private _textarea?: HTMLTextAreaElement;
	@property({ type: String }) public value: string = '';

	#oninput() { this.value = this._textarea!.value; }

	public override render() {
		return html`<textarea .value=${this.value || this.innerText} @input=${this.#oninput}></textarea>`;
	}

	public static override styles = css``;
}

declare global {
	interface HTMLElementTagNameMap {
		[TAG_NAME]: QTextarea;
	}
}
