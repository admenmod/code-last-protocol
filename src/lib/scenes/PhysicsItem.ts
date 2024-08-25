import { Vector2 } from 'ver/Vector2';
import { Event } from 'ver/events';
import { math as Math } from 'ver/helpers';
import { System } from 'ver/System';
import { Node2D } from './Node2D.js';

import { AABB, Shape, ShapeRect, Contact, ContactImpulse, Manifold } from './CollisionShape.js';
export { ShapeRect } from './CollisionShape.js';


// NOTE: [reflect] r.inc(restitution).angle = normal.angle*2 - vec1.angle;

export class PhysicsSystem extends System<typeof PhysicsItem> {
	public '@BeginContact' = new Event<PhysicsSystem, [Contact]>(this);
	public '@EndContact' = new Event<PhysicsSystem, [Contact]>(this);
	public '@PostSolve' = new Event<PhysicsSystem, [Contact, ContactImpulse]>(this);
	public '@PreSolve' = new Event<PhysicsSystem, [Contact, Manifold]>(this);

	public '@end' = new Event<PhysicsSystem, []>(this);

	constructor(public gravity = new Vector2(), public D = new Vector2().set(0.95)) {
		super(PhysicsItem);

		this['@add'].on(item => {
			item.world = this;
			item.emit('Physics:init');
		});
		this['@removing'].on(item => {
			item.emit('Physics:destroy');
			item.world = null;
		});
	}

	public dynamic_rect_rect(this: PhysicsSystem, a: PhysicsItem, b: PhysicsItem): boolean {
		if(a.shape.type !== 'ShapeRect' || b.shape.type !== 'ShapeRect') throw new Error('invalid params');

		const aAABB = a.getAABB(), bAABB = b.getAABB();
		const asize = aAABB.size(), bsize = bAABB.size();
		const apos = a.globalPosition, bpos = b.globalPosition;
		const avel = a.velocity, bvel = b.velocity;


		if(aAABB.intersect(bAABB)) {
			const a_vertices = [
				aAABB.min.new(),
				new Vector2(aAABB.max.x, aAABB.min.y),
				aAABB.max.new(),
				new Vector2(aAABB.min.x, aAABB.max.y)
			];
			const b_vertices = [
				bAABB.min.new(),
				new Vector2(bAABB.max.x, bAABB.min.y),
				bAABB.max.new(),
				new Vector2(bAABB.min.x, bAABB.max.y)
			];


			const isIntersect = (v: Vector2, vertices: Vector2[]) => {
				if(vertices.length % 2) throw new Error('HACK');

				for(let i = 0, j = i+1; i < vertices.length; i++, j = (j+1) % vertices.length) {
					const q = vertices[i], p = vertices[j];
					const edge = p.new().sub(q);
					const normal = edge.new().normal().normalize();

					// return v;
				}
			};

			for(let i = 0; i < b_vertices.length; i++) {
				isIntersect(b_vertices[i], a_vertices);
			}

			const c: Contact = {
				areaAABB: aAABB.diff(bAABB)
			};

			this.emit('BeginContact', c);
			a.emit('BeginContact', c);
			b.emit('BeginContact', c);

			return true;
		}

		return false;
	}

	public rect_rect(this: PhysicsSystem, a: PhysicsItem, b: PhysicsItem): boolean {
		if(a.shape.type !== 'ShapeRect' || b.shape.type !== 'ShapeRect') throw new Error('invalid params');

		const aAABB = a.getAABB(), bAABB = b.getAABB();
		// const asize = aAABB.size(), bsize = bAABB.size();

		if(aAABB.intersect(bAABB)) {
			const c: Contact = {
				areaAABB: aAABB.diff(bAABB)
			};

			const dsize = c.areaAABB.size();

			this.emit('BeginContact', c);
			a.emit('BeginContact', c);
			b.emit('BeginContact', c);


			const collition = (a: PhysicsItem, b: PhysicsItem) => {
				if(a.computeMass() > b.computeMass()) [a, b] = [b, a];
				const amass = 10 || a.computeMass(), bmass = 100 || b.computeMass();
				const c = bmass/amass;

				const adiff = dsize.new().sub(dsize.new().div(c));
				const bdiff = dsize.new().div(c);

				// console.log(c, dsize.toString());
				// console.log(`mass\na: ${amass}\nb: ${bmass}`);
				// console.log(`diff\na: ${adiff}\nb: ${bdiff}`);

				if(dsize.x < dsize.y) {
					if(a.position.x < b.position.x) {
						if(a.type_body === 'dynamic') {
							if(a.velocity.x > 0) a.velocity.x = 0;
							a.position.x -= adiff.x;
						}
						if(b.type_body === 'dynamic') {
							if(b.velocity.x < 0) a.velocity.x = 0;
							a.position.x -= bdiff.x;
						}
					} else {
						if(a.type_body === 'dynamic') {
							if(a.velocity.x < 0) a.velocity.x = 0;
							a.position.x += adiff.x;
						}
						if(b.type_body === 'dynamic') {
							if(b.velocity.x > 0) b.velocity.x = 0;
							b.position.x += bdiff.x;
						}
					}
				} else {
					if(a.position.y < b.position.y) {
						if(a.type_body === 'dynamic') {
							if(a.velocity.y > 0) a.velocity.y = 0;
							a.position.y -= adiff.y;
						}
						if(b.type_body === 'dynamic') {
							if(b.velocity.y < 0) b.velocity.y = 0;
							b.position.y -= bdiff.y;
						}
					} else {
						if(a.type_body === 'dynamic') {
							if(a.velocity.y < 0) a.velocity.y = 0;
							a.position.y += adiff.y;
						}
						if(b.type_body === 'dynamic') {
							if(b.velocity.y > 0) b.velocity.y = 0;
							b.position.y += bdiff.y;
						}
					}
				}
			};

			collition(a, b);

			return true;
		}

		return false;
	}

	public circle_circle(a: PhysicsItem, b: PhysicsItem): boolean {
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

	public circle_rect(a: PhysicsItem, b: PhysicsItem): boolean {
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
		for(let i = 0; i < this._items.length; i++) {
			const item = this._items[i];

			if(item.type_body === 'dynamic') {
				item.angular_velocity *= 0.9;
				item.rotation += item.angular_velocity;
				// item.rotation += item.angular_velocity * item.velocity.module / 5;

				item.velocity.add(this.gravity);
				item.velocity.inc(this.D);
				item.position.add(item.velocity);
			}
		}

		// HACK:
		return;

		for(let i = 0; i < this._items.length; i++) {
			const a = this._items[i];
			for(let j = i+1; j < this._items.length; j++) {
				const b = this._items[j];

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


export const PARENT_CACHE = Symbol('PARENT_CACHE');

export class PhysicsItem extends Node2D {
	protected [PARENT_CACHE]: PhysicsItem[] = [];

	public '@Physics:init' = new Event<PhysicsItem, []>(this);
	public '@Physics:destroy' = new Event<PhysicsItem, []>(this);
	public '@Physics:destroyed' = new Event<PhysicsItem, []>(this);

	public '@BeginContact' = new Event<PhysicsItem, [Contact]>(this);
	public '@EndContact' = new Event<PhysicsItem, [Contact]>(this);
	public '@PostSolve' = new Event<PhysicsItem, [Contact, ContactImpulse]>(this);
	public '@PreSolve' = new Event<PhysicsItem, [Contact, Manifold]>(this);


	public world: PhysicsSystem | null = null;

	public velocity = new Vector2();
	public angular_velocity: number = 0;

	public density = 1;
	public friction = 0.2;
	public restitution = 0.2;

	public type_body: 'dynamic' | 'static' = 'static';
	public shape!: Shape;
	public aabb = new AABB();

	constructor() {
		super();

		const ontree = () => {
			this[PARENT_CACHE].length = 0;
			this[PARENT_CACHE].push(...this.getChainParentsOf(PhysicsItem));
		};

		this['@tree_entered'].on(ontree);
		this['@tree_exiting'].on(ontree);
	}

	protected override async _init(): Promise<void> {
		await super._init();

		this.density = 1;
		this.friction = 0.2;
		this.restitution = 0.2;

		this.shape = this.shape || new ShapeRect(new Vector2(1, 1));
		this.getAABB();
	}

	public computeMass(): number {
		if(this.type_body === 'static') return Math.INF;
		if(this.shape.type === 'ShapeRect') return this.shape.size.x * this.shape.size.y * this.density;
		if(this.shape.type === 'ShapeCircle') return this.shape.radius ** 2 * Math.PI * this.density;
		throw new Error('unknown shape');
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
