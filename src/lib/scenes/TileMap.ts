import { Vector2 } from 'ver/Vector2';
import type { Viewport } from 'ver/Viewport';
import { MapParser } from 'ver/MapParser';
import { Node2D } from './Node2D.js';


export class TileMap extends Node2D {
	public readonly size = new Vector2(20, 20);

	private _cacheTile: { [id: number]: MapParser.Tileset } = {};

	public map: MapParser.Map | null = null;


	protected override _draw({ ctx }: Viewport): void {
		if(!this.map) return;

		const map = this.map;

		for(let i = 0; i < map.layers.length; i++) {
			const layer = map.layers[i];
			if(layer.type !== 'tilelayer') continue;

			if(!layer.visible) continue;

			for(let i = 0; i < layer.data.length; i++) {
				const count = layer.size.new();

				const id: number = layer.data[i];

				if(id === 0) continue;
				const l = new Vector2(i % count.x, Math.floor(i / count.x));

				let tileset!: MapParser.Tileset;

				if(!(tileset = this._cacheTile[id])) {
					for(let i = 0; i < map.tilesets.length; i++) {
						if(map.tilesets[i].firstgid <= id && !map.tilesets[i+1] || id < map.tilesets[i+1].firstgid) {
							tileset = map.tilesets[i];
							this._cacheTile[id] = tileset;
							break;
						}
					}
				}

				if(!tileset) {
					console.error('tileset not fined');
					continue;
				}

				const tid = id - tileset.firstgid;
				const tc = new Vector2(tid % tileset.columns, Math.floor(tid / tileset.columns));

				const size = this.size.new();

				const tileoffset = tc.new().inc(tileset.tile_size);
				const tilesize = tileset.tile_size.new();
				const drawsize = size.new();
				const drawpos = l.new().inc(size).sub(drawsize.new().div(2));

				ctx.drawImage(
					tileset.imagedata,
					tileoffset.x, tileoffset.y, tilesize.x, tilesize.y,
					drawpos.x, drawpos.y, drawsize.x, drawsize.y
				);
			}
		}
	}
}
