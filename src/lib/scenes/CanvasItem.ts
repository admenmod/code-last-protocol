import { Event } from 'ver/events';
import { math as Math } from 'ver/helpers';
import { System } from 'ver/System';
import type { Viewport } from 'ver/Viewport';
import { Node } from './Node.js';


export class RenderSystem extends System<typeof CanvasItem> {
	constructor() {
		super(CanvasItem);

		const zIndex = () => this._items.sort(this._sort);

		this['@add'].on(item => {
			item.on('change%zIndex', zIndex);
			zIndex();
		});

		this['@removing'].on(item => item.off('change%zIndex', zIndex));
	}

	protected _sort(a: CanvasItem, b: CanvasItem): number { return a.globalzIndex - b.globalzIndex; }

	public update(viewport: Viewport) {
		viewport.clear();

		for(let i = 0; i < this._items.length; i++) {
			this._items[i].render(viewport);
		}
	}
}


export const PARENT_CACHE = Symbol('PARENT_CACHE');

export class CanvasItem extends Node {
	public set '%visible'(v: boolean) { this.visible = v; }
	public get '%visible'(): boolean { return this.visible; }

	public set '%zAsRelative'(v: boolean) { this.zAsRelative = v; }
	public get '%zAsRelative'(): boolean { return this.zAsRelative; }

	public set '%zIndex'(v: number) { this.zIndex = v; }
	public get '%zIndex'(): number { return this.zIndex; }


	protected [PARENT_CACHE]: CanvasItem[] = [];

	public '@change%zIndex' = new Event<CanvasItem, [CanvasItem]>(this);


	protected _visible: boolean = true;
	public get visible() {
		for(let i = 0; i < this[PARENT_CACHE].length; i++) {
			if(!this[PARENT_CACHE][i]._visible) return false;
		}
		return this._visible;
	}
	public set visible(v) { this._visible = v; }

	private _alphaAsRelative: boolean = true;
	public set alphaAsRelative(v) { this._alphaAsRelative = v; }
	public get alphaAsRelative() { return this._alphaAsRelative; }

	private _alpha: number = 1;
	public get alpha() { return this._alpha; }
	public set alpha(v) { this._alpha = Math.clamp(0, v, 1); }

	protected _zAsRelative: boolean = true;
	public get zAsRelative() { return this._zAsRelative; }
	public set zAsRelative(v) {
		if(v === this._zAsRelative) return;
		this._zAsRelative = v;
		this['@change%zIndex'].emit(this);
	}

	protected _zIndex: number = 0;
	public get zIndex(): number { return this._zIndex; }
	public set zIndex(v: number) {
		if(v === this._zIndex) return;
		this._zIndex = v;
		this['@change%zIndex'].emit(this);
	}


	public get globalzIndex(): number { return this.getRelativezIndex(Node.MAX_NESTING, this[PARENT_CACHE]); }
	public get globalAlpha(): number { return this.getRelativeAlpha(Node.MAX_NESTING, this[PARENT_CACHE]); }

	public getRelativezIndex(nl: number = 0, arr: CanvasItem[] = this[PARENT_CACHE]): number {
		const l = Math.min(nl, arr.length, Node.MAX_NESTING);
		let acc = this.zIndex;

		if(!this.zAsRelative) return acc;

		for(let i = 0; i < l; i++) {
			acc += arr[i].zIndex;

			if(!arr[i].zAsRelative) return acc;
		}

		return acc;
	}

	public getRelativeAlpha(nl: number = 0, arr: CanvasItem[] = this[PARENT_CACHE]): number {
		const l = Math.min(nl, arr.length, Node.MAX_NESTING);
		let acc = this.alpha;

		if(!this.alphaAsRelative) return acc;

		for(let i = 0; i < l; i++) {
			acc *= arr[i].alpha;

			if(!arr[i].alphaAsRelative) return acc;
		}

		return acc;
	}


	constructor() {
		super();

		const ontree = () => {
			this[PARENT_CACHE].length = 0;
			this[PARENT_CACHE].push(...this.getChainParentsOf(CanvasItem));
		};

		this['@tree_entered'].on(ontree);
		this['@tree_exiting'].on(ontree);
	}


	protected _render(viewport: Viewport): void {}

	public render(viewport: Viewport): void {
		if(!this.visible) return;

		this._render(viewport);
	}
}
