import { Vector2 } from 'ver/Vector2';
import { State } from 'ver/State';
import { math as Math } from 'ver/helpers';
import { Animation } from 'ver/Animation';
import type { Viewport } from 'ver/Viewport';

import { SensorCamera } from 'lib/SensorCamera';
import { Node2D } from 'lib/scenes/Node2D';
import { Control } from 'lib/scenes/Control';
import { Sprite } from 'lib/scenes/Sprite';
import { Camera2D } from 'lib/scenes/Camera2D';
import { GridMap } from 'lib/scenes/gui/GridMap';
import { SystemInfo } from 'lib/scenes/gui/SystemInfo';
import { WorldMap } from './WorldMap';
import { MainBase } from './MainBase';

import { touches, viewport } from '@/canvas';
import { audioContorller } from '../state';


class Info extends Node2D {
	public self!: MainScene;
	protected override async _init(): Promise<void> { this.draw_distance = Math.INF; }
	protected override _ready(): void { this.zIndex = 1000; }

	protected override _draw({ ctx }: Viewport): void {
		const center = Vector2.ZERO;
		const a = 30;

		// ctx.save();
		// ctx.beginPath();
		// ctx.globalAlpha = 0.2;
		// ctx.strokeStyle = '#ffff00';
		// ctx.moveTo(center.x, center.y-a);
		// ctx.lineTo(center.x, center.y+a);
		// ctx.moveTo(center.x-a, center.y);
		// ctx.lineTo(center.x+a, center.y);
		// ctx.stroke();
		// ctx.restore();


		ctx.resetTransform();
		viewport.scalePixelRatio();
	}
}


export class MainScene extends Control {
	protected static override async _load(scene: typeof this): Promise<void> {
		await Sprite.load();
		await super._load(scene);

		await audioContorller.load('shot', 'assets/audio/lazer-shot.mp3');
	}

	public override TREE() { return {
		Camera2D,
		WorldMap,
		GridMap,
		MainBase,
		Info,
		SystemInfo
	}}
	// aliases
	public get $camera() { return this.get('Camera2D'); }
	public get $gridMap() { return this.get('GridMap'); }
	public get $info() { return this.get('Info'); }
	public get $worldMap() { return this.get('WorldMap'); }

	public sensor_camera = new SensorCamera();

	protected override async _init(this: MainScene): Promise<void> {
		await super._init();

		this.$camera.viewport = viewport;
		this.$camera.current = true;

		this.$camera.on('PreProcess', dt => {
			this.sensor_camera.update(dt, touches, this.$camera);
			// this.$camera.rotation += Math.mod(this.$ship.rotation-this.$camera.rotation, -Math.PI, Math.PI) / 5;


			this.$gridMap.scroll.set(this.$camera.position);
			this.$gridMap.position.set(this.$camera.position);
			this.$gridMap.size.set(this.$camera.size.new().inc(this.$camera.scale)).inc(5);
		});

		this.$gridMap.tile.set(64, 64);

		this.$info.self = this;


		viewport.on('resize', size => {
			const s = size.new().div(2);
		}).call(viewport, viewport.size);
	}

	protected override _ready(this: MainScene): void {
		;
	}

	protected override _process(this: MainScene, dt: number): void {
		;
	}
}
