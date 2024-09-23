import { LitElement, PropertyValueMap, css, html } from 'lit'
import { customElement, property, query } from 'lit/decorators.js'
import { ref } from 'lit/directives/ref.js';
import { QTextarea } from './q-textarea';
import './q-textarea';


import 'mol_wire_lib';


const TAG_NAME = 'q-gui';

const UPDATE = Symbol('UPDATE');

const react: MethodDecorator = (target, key) => {
	const f = (target as any)[key] as (...args: any) => any;

	const moke = {};
	Object.defineProperty(moke, key, Object.assign(Object.getOwnPropertyDescriptor(target, key)!, {
		value: function(next: any) { console.log(this); this[UPDATE]?.(key, next); return f.call(this, next); }
	}));

	$mol_mem(moke, key);

	target[key] = moke[key];

	return moke[key];
};

export @customElement(TAG_NAME) class QGUI extends LitElement {
	// @ $mol_mem public $render(next = NaN) { this.requestUpdate(); return next; }

	public [UPDATE](key: any) { console.log(22, key); this.requestUpdate(); }

	@react public aa(next = '') { return next; }
	@react public aaaaa(next = 'sje') { return 'smms'+this.aa(); }

	// @ $mol_mem public code_edit() {
	// 	const el = document.createElement('textarea');
	// 	el.value = '';
	// 	el.oninput = e => void (this.aa((e.currentTarget as HTMLTextAreaElement).value));
	// 	return el;
	// }

	@query('textarea') private code_area?: QTextarea;
	@property() public get ee() { return this.code_area?.value; }

	public csss = {
		zIndex: '1',
		display: 'grid',
		gap: '10px',
		alignContent: 'center',
		justifyContent: 'center',
		gridTemplate: 'repeat(4, max-content) / repeat(2, max-content)',
		gridAutoFlow: 'column dense',
		padding: '20px',
		width: '100vw',
		height: '100dvh',
		overflow: 'hidden',

		alignSelf: 'center',
		justifySelf: 'center',
		gridArea: '1/1/1/1'
	} satisfies Partial<CSSStyleDeclaration>;

	public override render() {
		// ${this.code_edit()}
		// <div>${this.aaaaa()}</div>
		// <button @click=${() => console.log(this.aaaaa())}>show</button>

		return html`
			<div gui theme-custom class='GUI' style=${this.csss}>
				<textarea .value=${this.aa()} @input=${() => this.aa(this.code_area?.value)}></textarea>
				${'' && '<q-textarea .value=${this.aa()} />'}

				<div>${this.aaaaa()}</div>
			</div>

			<slot gui theme-custom class='GUI' style=${this.csss}></slot>
		`;
	}

	public static override styles = css`
		:host {
			q-textarea {
				color: #ff0000;
			}
		}

		[theme-custom] {
			--main-color: hsl(200, 70%, 70%);

			accent-color: color-mix(in oklab, var(--main-color) 70%, #000000);

			font-family: arkhip, monospace;

			div {
				font-family: arkhip, monospace;
			}

			button {
				user-select: none;
				font-family: arkhip, monospace;
			}

			input, button, textarea {
				padding: 5px 10px;
				color: var(--main-color);
				background: color-mix(in oklab, var(--main-color) 10%, #333333);
				border: solid 1px color-mix(in oklab, var(--main-color) 60%, #777777);
				transition: all 100ms ease-in;
			}

			input:focus, button:active textarea:focus, textarea:active {
				border: solid 1px color-mix(in oklab, var(--main-color) 60%, #ffffff);
				border-radius: 5px;
			}
		}
	`;
}

declare global {
	interface HTMLElementTagNameMap {
		[TAG_NAME]: QGUI;
	}
}
