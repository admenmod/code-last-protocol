import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import { Control } from 'lib/scenes/Control';
import { $selected_structure } from '@/scenes/game/state';


export class Structure extends Control {
	public '@click' = new Event<Structure, []>(this);

	public title = '<Structure.title>';
	public readonly size = new Vector2(100, 100, vec => this.draw_distance = vec.module);

	protected override async _init(this: Structure): Promise<void> {
		await super._init();

		this.on('click', () => {
			$selected_structure.set(this);
		});

		const fck = this.on('input:click', ({ pos, touch }) => {
			if(touch.clickCount !== 1) return;

			const position = this.globalPosition;
			const size = this.globalScale.inc(this.size);

			if(
				pos.x < position.x + size.x/2 && pos.x > position.x - size.x/2 &&
				pos.y < position.y + size.y/2 && pos.y > position.y - size.y/2
			) this.emit('click');
		});

		this.on('destroy', () => {
			this.off('input:click', fck);
		});
	}
}
