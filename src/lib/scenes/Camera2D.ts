import { Vector2 } from 'ver/Vector2';
import type { Viewport } from 'ver/Viewport';

import { Node2D } from './Node2D.js';


export class Camera2D extends Node2D {
	public size = new Vector2();

	public _current: boolean = false;
	public get current(): boolean { return this._current; }
	public set current(v: boolean) { this._current = v; }

	private _viewport: Viewport | null = null;
	public get viewport() { return this._viewport; }
	public set viewport(v) {
		this._viewport = v;
		if(v) this.size = v.size;
	}


	protected override _ready(): void {
		this.zIndex = 10000;
		this.processPriority = 10000;
	}


	protected override _process(dt: number): void {
		if(this.viewport && this.current) {
			this.viewport.position.set(this.globalPosition);
			this.viewport.scale.set(this.globalScale);
			this.viewport.rotation = this.globalRotation;
		}
	}
}
