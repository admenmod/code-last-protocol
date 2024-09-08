import { Vector2 } from 'ver/Vector2';
import { State } from 'ver/State';
import { math as Math } from 'ver/helpers';
import { Animation } from 'ver/Animation';
import type { Viewport } from 'ver/Viewport';
import type { KeymapperOfActions } from 'ver/KeymapperOfActions';

import { SensorCamera } from 'lib/SensorCamera';
import { Node2D } from 'lib/scenes/Node2D';
import { Control } from 'lib/scenes/Control';
import { Sprite } from 'lib/scenes/Sprite';
import { Camera2D } from 'lib/scenes/Camera2D';
import { GridMap } from 'lib/scenes/gui/GridMap';
import { SystemInfo } from 'lib/scenes/gui/SystemInfo';
import { World } from './World';
import { MainBase } from './MainBase';

import { touches, viewport } from '@/canvas';

import { AudioContorller } from 'lib/AudioController';
export const audioContorller = new AudioContorller();

import { ka_main } from '@/keyboard';
import { Unit } from '@/world/unit';
import { CELL_SIZE } from '@/config';


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
		GridMap,
		Info,
		SystemInfo,
		World
	}}
	// aliases
	public get $camera() { return this.get('Camera2D'); }
	public get $gridMap() { return this.get('GridMap'); }
	public get $info() { return this.get('Info'); }
	public get $world() { return this.get('World'); }

	public sensor_camera = new SensorCamera();

	protected override async _init(this: MainScene): Promise<void> {
		await super._init();

		this.$camera.viewport = viewport;
		this.$camera.current = true;

		this.$camera.on('PreProcess', dt => {
			this.sensor_camera.update(dt, touches, this.$camera);

			this.$camera.position.moveTime(this.$world.$units.items[0].cell.new().inc(CELL_SIZE), 5);
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
		this.$world.$structures.create(MainBase, new Vector2());
		const unit = this.$world.$units.create(Unit, new Vector2(0, 0));

		const onmove: KeymapperOfActions.Action = ({ mapping: [dir] }) => {
			dir = dir.replace('Arrow', '');

			if(dir === 'Left')	unit.diration -= 1;
			if(dir === 'Right')	unit.diration += 1;
			if(dir === 'Up') this.$world.moveForward(unit, 1);
		};
		ka_main.register(['ArrowLeft'], onmove);
		ka_main.register(['ArrowRight'], onmove);
		ka_main.register(['ArrowUp'], onmove);
		ka_main.register(['ArrowDown'], onmove);

		ka_main.register(['s'], () => {
			this.$world.unitRadarScan(unit);
		});
		ka_main.register(['w'], () => {
			this.$world.unitExtractForward(unit, 1);
		});
	}

	protected override _process(this: MainScene, dt: number): void {
		;
	}
}
