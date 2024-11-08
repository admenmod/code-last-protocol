import { Vector2 } from 'ver/Vector2';
import { math as Math } from 'ver/helpers';
import type { Viewport } from 'ver/Viewport';
import type { KeymapperOfActions } from 'ver/KeymapperOfActions';

import { SensorCamera } from 'lib/SensorCamera';
import { Node2D } from 'lib/scenes/Node2D';
import { Control } from 'lib/scenes/Control';
import { Sprite } from 'lib/scenes/Sprite';
import { Camera2D } from 'lib/scenes/Camera2D';
import { GridMap } from 'lib/scenes/gui/GridMap';
import { SystemInfo } from 'lib/scenes/gui/SystemInfo';

import { touches, viewport } from '@/canvas';

import { AudioContorller } from 'lib/AudioController';
export const audioContorller = new AudioContorller();

import { ka_main } from '@/keyboard';

import '@/modules/ScriptModule';
import '@/modules/MoveModule';
import '@/modules/ScanModule';
import '@/modules/CargoModule';
import '@/modules/ExtractModule';

import { SIZE_X, SIZE_Y, world } from '@/game/world';
import { CELL_SIZE } from '@/config';
import { god_global_event } from '@/app/game';


class Info extends Node2D {
	public self!: MainScene;
	protected override async _init(): Promise<void> { this.draw_distance = Math.INF; }
	protected override _ready(): void { this.zIndex = 1000; }

	protected override _draw({ ctx }: Viewport): void {
		// const center = Vector2.ZERO;
		// const a = 30;
		//
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
	}}
	// aliases
	public get $camera() { return this.get('Camera2D'); }
	public get $gridMap() { return this.get('GridMap'); }
	public get $info() { return this.get('Info'); }

	public sensor_camera = new SensorCamera();

	protected override async _init(this: MainScene): Promise<void> {
		await super._init();
		this.draw_distance = Math.INF;

		this.$camera.viewport = viewport;
		this.$camera.current = true;

		this.$camera.on('PreProcess', dt => {
			this.sensor_camera.update(dt, touches, this.$camera);

			// this.$camera.position.moveTime(this.$world.$units.items[0].cell.new().inc(CELL_SIZE), 5);
			// this.$camera.rotation += Math.mod(this.$ship.rotation-this.$camera.rotation, -Math.PI, Math.PI) / 5;

			// this.$gridMap.scroll.set(this.$camera.position);
			// this.$gridMap.position.set(this.$camera.position);
			// this.$gridMap.size.set(this.$camera.size.new().inc(this.$camera.scale)).inc(5);
		});

		this.$gridMap.position.set();
		this.$gridMap.size.set(SIZE_X, SIZE_Y);
		this.$gridMap.tile.set(CELL_SIZE);

		this.$info.self = this;


		// viewport.on('resize', size => {
		// 	const s = size.new().div(2);
		// }).call(viewport, viewport.size);
	}

	protected override _ready(this: MainScene): void {
		const base = world.create(new Vector2(0, 0), ['script', 'scan', 'cargo'], {
			height: 4,
			size: new Vector2(4, 4),
			direction: 0,

			scan: { force: 1 },
			cargo: { size: 10 }
		});

		const unit = world.create(new Vector2(0, 0), ['script', 'move', 'scan', 'cargo', 'extract'], {
			height: 1,
			size: new Vector2(1, 1),
			direction: 0,

			move: { force: 1 },
			scan: { force: 1 },
			cargo: { size: 10 },
			extract: { force: 1 }
		});

		(async () => {
			await base.ready();
			const base_code = await fetch(`${location.origin}/user/structure.js`).then(data => data.text());
			unit.get('script')!.run(base_code);

			await unit.ready();
			const unit_code = await fetch(`${location.origin}/user/unit.js`).then(data => data.text());
			unit.get('script')!.run(unit_code);

			god_global_event.on(code => {
				unit.get('script')!.run(code);
			});
		})();

		const onmove: KeymapperOfActions.Action = ({ mapping: [dir] }) => {
			dir = dir.replace('Arrow', '');

			if(dir === 'Left')	unit.direction -= 1;
			if(dir === 'Right')	unit.direction += 1;
			if(dir === 'Up') unit.get('move')!.moveForward(1);
		};
		ka_main.register(['ArrowLeft'], onmove);
		ka_main.register(['ArrowRight'], onmove);
		ka_main.register(['ArrowUp'], onmove);
		ka_main.register(['ArrowDown'], onmove);

		ka_main.register(['s'], () => {
			unit.get('scan')!.scan();
		});
		ka_main.register(['w'], () => {
			unit.get('extract')!.extract();
		});
	}

	protected override _process(this: MainScene, dt: number): void {
		world.update(dt);
	}

	protected override _draw({ ctx }: Viewport): void {
		ctx.save(); // world map
		ctx.imageSmoothingEnabled = false;

		ctx.fillStyle = '#000000';
		ctx.fillRect(-SIZE_X/2, -SIZE_Y/2, SIZE_X, SIZE_Y);

		ctx.globalAlpha = 0.5;
		ctx.drawImage(world.canvas_map.canvas, -SIZE_X/2, -SIZE_Y/2, SIZE_X, SIZE_Y);
		ctx.globalAlpha = 1;
		ctx.drawImage(world.scaned_map.canvas, -SIZE_X/2, -SIZE_Y/2, SIZE_X, SIZE_Y);
		ctx.restore();

		for(let i = 0; i < world.entitys.length; i++) {
			const entity = world.entitys[i];

			const pos = entity.cell.new().inc(CELL_SIZE)
			const rot = Math.TAU/8 * entity.direction;
			const size = entity.size.new().inc(CELL_SIZE);

			if(entity.size.x % 2) pos.x += CELL_SIZE/2;
			if(entity.size.y % 2) pos.y += CELL_SIZE/2;

			ctx.save();
			ctx.translate(pos.x, pos.y);
			ctx.rotate(rot);

			if(entity.get('move')) {
				const c = 8;
				ctx.fillStyle = '#eeee33';
				ctx.beginPath();
				ctx.moveTo(-c, 0);
				ctx.lineTo(+c, -c/2);
				ctx.lineTo(+c, +c/2);
				ctx.closePath();
				ctx.fill();
			} else {
				ctx.fillStyle = '#3333ee';
				ctx.fillRect(-size.x/2, -size.y/2, size.x, size.y);
			}

			ctx.restore();
		}
	}
}
