import { math as Math } from 'ver/helpers';
import { Vector2 } from 'ver/Vector2';

import { Node } from 'lib/scenes/Node';

import { generatePerlinNoise } from '@vicimpa/perlin-noise';
import { CELL_SIZE } from '@/config';

import { WorldMap } from './WorldMap';
import { UnitsL } from './UnitsL';
import { StructuresL } from './StructuresL';
import { ResourcesL } from './ResourcesL';

import { Unit } from '@/world/unit';
import { dirToVec2 } from '@/utils/cell';
import { GridMap } from 'lib/scenes/gui/GridMap';



const W = 128, H = 128;
const MAP_SIZE = W * H;
const SIZE_X = CELL_SIZE*W, SIZE_Y = CELL_SIZE*H; 

export const I = (v: Vector2) => (v.x+W/2) + (v.y+H/2) * W;
export const XY = (i: number) => new Vector2(i % W, Math.floor(i/W));

const SEED_HEIGHT_MAP = 0x6147db;
const seedR = 0x1d1f10; // const seedG = 0x1aa80b; const seedB = 0x8a2864;


export class World extends Node {
	public override TREE() { return {
		WorldMap,
		ResourcesL,
		StructuresL,
		UnitsL,
		GridMap
	}}
	// aliases
	public get $gridMap() { return this.get('GridMap'); }
	public get $map() { return this.get('WorldMap'); }
	public get $units() { return this.get('UnitsL'); }
	public get $resources() { return this.get('ResourcesL'); }
	public get $strutcure() { return this.get('StructuresL'); }


	public ll: number = 0.5;

	public height_map = generatePerlinNoise(W, H, {
		seed: SEED_HEIGHT_MAP, amplitude: 0.1, octaveCount: 6, persistence: 0.5
	});

	public demp_map = generatePerlinNoise(W, H, {
		seed: seedR, amplitude: 0.1, octaveCount: 6, persistence: 0.5
	});


	public hasMoveToPos(unit: Unit, rpos: Vector2): boolean {
		const pos = unit.cell.new().add(rpos);
		const UCI = I(pos); // Unit cell index

		console.log(this.$map.height_map[UCI]);
		if(this.$map.height_map[UCI] > 0.3) return false;

		return true;
	}

	public move(unit: Unit, rpos: Vector2) {
		if(this.hasMoveToPos(unit, rpos)) unit.cell.add(rpos);
	}

	public moveForward(unit: Unit) {
		const S = 1;

		return this.move(unit, dirToVec2(unit.diration).inc(S));
	}


	protected override async _init(): Promise<void> {
		await super._init();

		this.$gridMap.position.set();
		this.$gridMap.size.set(W, H).inc(CELL_SIZE);
		this.$gridMap.tile.set(CELL_SIZE);
	}
}
