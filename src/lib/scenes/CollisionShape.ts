import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import { math as Math } from 'ver/helpers';
import { System } from 'ver/System';
import { Node2D } from './Node2D.js';



export class AABB {
	constructor(public min = new Vector2(), public max = new Vector2()) {}

	public size() { return this.max.new().sub(this.min); }

	public diff(aabb: AABB): AABB {
		return new AABB(
			new Vector2(Math.max(this.min.x, aabb.min.x), Math.max(this.min.y, aabb.min.y)),
			new Vector2(Math.min(this.max.x, aabb.max.x), Math.min(this.max.y, aabb.max.y))
		);
	}

	public intersect(aabb: AABB): boolean {
		return this.max.x > aabb.min.x && this.max.y > aabb.min.y && aabb.max.x > this.min.x && aabb.max.y > this.min.y;
	}
}


export interface Contact {
	areaAABB: AABB;
}
export interface Manifold {}
export interface ContactImpulse {}


export const deleteFromArray = <T>(arr: T[], o: T): T | void => {
	const l = arr.indexOf(o);
	if(!~l) return;
	return arr.splice(l, 1)[0];
};

export class ShapeBase {
	public readonly type = 'ShapeBase' as string;
	constructor() {}
}

export class ShapeCircle extends ShapeBase {
	public override readonly type = 'ShapeCircle';

	constructor(public radius: number) {
		super();
	}
}

export class ShapeRect extends ShapeBase {
	public override readonly type = 'ShapeRect';

	constructor(public size: Vector2) {
		super();
	}
}


export type Shape = ShapeRect | ShapeCircle;


export class CollisionsSystem extends System<typeof CollisionShape> {
	public '@BeginContact' = new Event<CollisionsSystem, [Contact]>(this);
	public '@EndContact' = new Event<CollisionsSystem, [Contact]>(this);
	public '@PostSolve' = new Event<CollisionsSystem, [Contact, ContactImpulse]>(this);
	public '@PreSolve' = new Event<CollisionsSystem, [Contact, Manifold]>(this);

	public '@step' = new Event<CollisionsSystem, [dt: number]>(this);

	public '@end' = new Event<CollisionsSystem, []>(this);

	public items: CollisionShape[] = [];

	constructor(public gravity = new Vector2()) {
		super(CollisionShape);

		this['@add'].on(item => this.createItem(item));
		this['@removing'].on(item => this.destroyItem(item));


		const PREORITY = -100;

		this['@BeginContact'].on(c => {
			for(let i = 0; i < this._items.length; i++) this._items[i]['@BeginContact'].emit(c);
		}, PREORITY);
		this['@EndContact'].on(c => {
			for(let i = 0; i < this._items.length; i++) this._items[i]['@EndContact'].emit(c);
		}, PREORITY);
		this['@PostSolve'].on((c, ci) => {
			for(let i = 0; i < this._items.length; i++) this._items[i]['@PostSolve'].emit(c, ci);
		}, PREORITY);
		this['@PreSolve'].on((c, m) => {
			for(let i = 0; i < this._items.length; i++) this._items[i]['@PreSolve'].emit(c, m);
		}, PREORITY);
	}

	public createItem<T extends CollisionShape>(item: T): T {
		this.items.push(item);
		item['@Physics:init'].emit();
		return item;
	}

	public destroyItem<T extends CollisionShape>(item: T): T {
		const l = this.items.indexOf(item);
		if(!~l) throw new Error('item not fined');

		item['@Physics:destroy'].emit();
		this.items.splice(l, 1);

		item['@Physics:destroyed'].emit();

		return item;
	}


	public rect_rect(a: CollisionShape, b: CollisionShape): boolean {
		if(a.shape.type !== 'ShapeRect' || b.shape.type !== 'ShapeRect') throw new Error('invalid params');

		const aAABB = a.getAABB(), bAABB = b.getAABB();
		const asize = aAABB.size(), bsize = bAABB.size();
		const apos = a.globalPosition, bpos = b.globalPosition;

		if(aAABB.intersect(bAABB)) {
			const c: Contact = {
				areaAABB: aAABB.diff(bAABB)
			};

			a.emit('intersect', c, a, b);
			b.emit('intersect', c, b, a);

			if(Math.abs(bpos.x-apos.x) > Math.abs(bpos.y-apos.y)) {
				if(apos.x < bpos.x) console.log('r');
				else console.log('l');
			} else {
				if(apos.y < bpos.y) console.log('d');
				else console.log('u');
			}

			return true;
		}

		return false;
	}

	public circle_circle(a: CollisionShape, b: CollisionShape): boolean {
		// if(a.shape.type !== 'ShapeCircle' || b.shape.type !== 'ShapeCircle') throw new Error('invalid params');
		//
		// let diff = a.position.getDistance(b.position) - (a.shape.radius + b.shape.radius);
		// if(diff < 0) {
		// 	diff = Math.abs(diff);
		// 	if(a.shape.mass > b.shape.mass) [a, b] = [b, a];
		// 	const c = b.shape.mass/a.shape.mass;
		// 	a.position.moveAngle(diff - diff/c, b.position.getAngleRelative(a.position));
		// 	b.position.moveAngle(diff/c, a.position.getAngleRelative(b.position));
		//
		// 	return true;
		// }

		return false;
	}

	public circle_rect(a: CollisionShape, b: CollisionShape): boolean {
		// if(a.shape.type !== 'ShapeCircle' || b.shape.type !== 'ShapeRect') throw new Error('invalid params');
		//
		// const p = new Vector2(
		// 	Math.max(b.position.x-b.shape.size.x/2, Math.min(a.position.x, b.position.x+b.shape.size.x/2)),
		// 	Math.max(b.position.y-b.shape.size.y/2, Math.min(a.position.y, b.position.y+b.shape.size.y/2))
		// );
		//
		// if(a.position.getDistance(p) < a.shape.radius) {
		// 	if(Math.abs(b.position.x-a.position.x) > Math.abs(b.position.y-a.position.y)) {
		// 		if(a.position.x < b.position.x) a.position.x += (b.position.x - b.shape.size.x/2) - (a.position.x+a.shape.radius);
		// 		else a.position.x += (b.position.x + b.shape.size.x/2) - (a.position.x-a.shape.radius);
		// 	} else {
		// 		if(a.position.y < b.position.y) a.position.y += (b.position.y - b.shape.size.y/2) - (a.position.y+a.shape.radius);
		// 		else a.position.y += (b.position.y + b.shape.size.y/2) - (a.position.y-a.shape.radius);
		// 	}
		//
		// 	return true;
		// }

		return false;
	}


	public step(dt: number): void {
		this['@step'].emit(dt);

		for(let i = 0; i < this.items.length; i++) {
			const a = this.items[i];
			for(let j = i+1; j < this.items.length; j++) {
				const b = this.items[j];

				if(a.shape.type === 'ShapeRect' && b.shape.type === 'ShapeRect') {
					this.rect_rect(a, b);
				} else if(a.shape.type === 'ShapeCircle' && b.shape.type === 'ShapeCircle') {
					this.circle_circle(a, b);
				} else if(a.shape.type === 'ShapeCircle' && b.shape.type === 'ShapeRect') {
					this.circle_rect(a, b);
				} else if(a.shape.type === 'ShapeRect' && b.shape.type === 'ShapeCircle') {
					this.circle_rect(b, a);
				}
			}
		}
	}

	public clearForces(): void {}

	public update(dt: number) {
		this.step(dt);
		this.clearForces();
		this['@end'].emit();
	}
}


const PARENT_CACHE = Symbol('PARENT_CACHE');

export class CollisionShape extends Node2D {
	protected [PARENT_CACHE]: CollisionShape[] = [];

	public '@Physics:init' = new Event<CollisionShape, []>(this);
	public '@Physics:destroy' = new Event<CollisionShape, []>(this);
	public '@Physics:destroyed' = new Event<CollisionShape, []>(this);

	public '@BeginContact' = new Event<CollisionShape, [Contact]>(this);
	public '@EndContact' = new Event<CollisionShape, [Contact]>(this);
	public '@PostSolve' = new Event<CollisionShape, [Contact, ContactImpulse]>(this);
	public '@PreSolve' = new Event<CollisionShape, [Contact, Manifold]>(this);


	public '@intersect' = new Event<CollisionShape, [c: Contact, a: CollisionShape, b: CollisionShape]>(this);


	public aabb = new AABB(new Vector2(), new Vector2());


	public bulk: number = 1;
	public computeMass(): number {
		if(this.shape.type === 'ShapeRect') return this.shape.size.x * this.shape.size.y * this.bulk;
		if(this.shape.type === 'ShapeCircle') return this.shape.radius ** 2 * Math.PI * this.bulk;
		throw new Error('unknown shape');
	}

	public shape!: Shape;

	protected override async _init(): Promise<void> {
		this.shape = this.shape || new ShapeRect(new Vector2(1, 1));

		this.getAABB();
	}

	public getAABB(): AABB {
		const pos = this.globalPosition;
		const size = new Vector2();

		if(this.shape.type === 'ShapeRect') size.set(this.shape.size).inc(this.globalScale);
		else if(this.shape.type === 'ShapeCircle') size.set(this.shape.radius*2).inc(this.globalScale);
		else throw new Error('unknown shape');

		this.aabb.min.set(size.new().div(2).invert().add(pos));
		this.aabb.max.set(size.new().div(2).add(pos));

		return this.aabb;
	}
}
