import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';

import { Node } from './Node.js';
import { CanvasItem } from './CanvasItem.js';


export const PARENT_CACHE = Symbol('PARENT_CACHE');

export class Node2D extends CanvasItem {
	public '@PreRender' = new Event<Node2D, [viewport: Viewport]>(this);
	public '@PostRender' = new Event<Node2D, [viewport: Viewport]>(this);


	protected [PARENT_CACHE]: Node2D[] = [];


	public positionAsRelative: boolean = true;
	public scaleAsRelative: boolean = true;
	public rotationAsRelative: boolean = true;

	public based_on_camera_isCentred: boolean = true;

	public draw_distance: number = 0;


	public position = new Vector2();
	public pivot_offset = new Vector2();
	public scale = new Vector2(1, 1);

	protected _rotation: number = 0;
	public get rotation(): number { return this._rotation; }
	public set rotation(v: number) { this._rotation = Math.mod(v, -Math.PI, Math.PI); }


	constructor() {
		super();

		const ontree = () => {
			this[PARENT_CACHE].length = 0;
			this[PARENT_CACHE].push(...this.getChainParentsOf(Node2D));
		};

		this['@tree_entered'].on(ontree);
		this['@tree_exiting'].on(ontree);
	}


	public get globalPosition(): Vector2 { return this.getRelativePosition(Node.MAX_NESTING); }
	public get globalScale(): Vector2 { return this.getRelativeScale(Node.MAX_NESTING); }
	public get globalRotation(): number { return this.getRelativeRotation(Node.MAX_NESTING); }


	public getRelativePosition(nl: number = 0, arr: Node2D[] = this[PARENT_CACHE]): Vector2 {
		if(!this.positionAsRelative || !arr.length) return this.position.new();

		const l = Math.min(nl, arr.length, Node.MAX_NESTING);
		const acc = new Vector2();

		let prev: Node2D = this, next: Node2D | null = null;

		for(let i = 0; i < l; i++) {
			next = arr[i];

			acc.add(prev.position);

			if(next.rotation !== 0) {
				acc.sub(next.pivot_offset);
				acc.rotate(next.rotation);
				acc.add(next.pivot_offset);
			}

			acc.inc(next.scale);

			if(!arr[i].positionAsRelative) break;

			prev = next;
		}

		if(arr.length) acc.add(arr[arr.length-1].position);

		return acc;
	}

	public getRelativeScale(nl: number = 0, arr: Node2D[] = this[PARENT_CACHE]): Vector2 {
		if(!this.scaleAsRelative) return this.scale.new();

		const l = Math.min(nl, arr.length, Node.MAX_NESTING);
		const acc = this.scale.new();

		for(let i = 0; i < l; i++) {
			acc.inc(arr[i].scale);

			if(!arr[i].scaleAsRelative) return acc;
		}

		return acc;
	}

	public getRelativeRotation(nl: number = 0, arr: Node2D[] = this[PARENT_CACHE]): number {
		if(!this.rotationAsRelative) return this.rotation;

		const l = Math.min(nl, arr.length, Node.MAX_NESTING);
		let acc = this.rotation;

		for(let i = 0; i < l; i++) {
			if(arr[i].rotation !== 0) acc += arr[i].rotation;

			if(!arr[i].rotationAsRelative) return acc;
		}

		return acc;
	}


	protected _draw(viewport: Viewport): void {}

	protected override _render(viewport: Viewport): void {
		const pos = this.globalPosition;

		if(!viewport.isInViewport(pos, this.draw_distance)) return;

		viewport.ctx.save();
		viewport.use(this.based_on_camera_isCentred);

		const scale = this.globalScale;
		const rot = this.globalRotation;
		const pivot = this.pivot_offset;


		viewport.ctx.translate(pos.x, pos.y);

		if(pivot.x !== 0 || pivot.y !== 0) {
			viewport.ctx.translate(pivot.x, pivot.y);
			viewport.ctx.rotate(rot);
			viewport.ctx.translate(-pivot.x, -pivot.y);
		} else viewport.ctx.rotate(rot);

		viewport.ctx.scale(scale.x, scale.y);

		viewport.ctx.globalAlpha = this.globalAlpha;

		this['@PreRender'].emit(viewport);
		this._draw(viewport);
		this['@PostRender'].emit(viewport);

		viewport.ctx.restore();
	}
}
