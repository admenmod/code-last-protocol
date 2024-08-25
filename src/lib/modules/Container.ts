import { Vector2 } from 'ver/Vector2';
import { Event, EventDispatcher } from 'ver/events';
import { math as Math } from 'ver/helpers';


interface IBaseItem { id: string; }

export class Container<
	Class extends new (...args: any) => IBaseItem,
	IData extends IBaseItem
> extends EventDispatcher {
	public '@create' = new Event<Container<Class, IData>, [item: InstanceType<Class>, data: IData, isNewItem: boolean]>(this);
	public '@create:new' = new Event<Container<Class, IData>, [item: InstanceType<Class>, data: IData]>(this);
	public '@create:renew' = new Event<Container<Class, IData>, [item: InstanceType<Class>, data: IData]>(this);

	public '@deleteing' = new Event<Container<Class, IData>, [item: InstanceType<Class>]>(this);;
	public '@deleted' = new Event<Container<Class, IData>, [id: string]>(this);;


	public items: InstanceType<Class>[] = [];

	constructor(
		public readonly Class: Class,
		public max_items: number,
		public setup: (item: InstanceType<Class>, data: IData, isNewItem?: boolean) => any
	) { super(); }


	public assign(item: InstanceType<Class>, data: IData): void {
		for(const id in data) {
			const type = typeof data[id];

			if(type === 'string' || type === 'number' || type === 'boolean' ||
			   type === 'bigint' || type === 'undefined' || data[id] === null) (item as any)[id] = data[id];
		}
	}

	public getById(id: string) { return this.items.find(o => o.id === id); }

	public async create(this: Container<Class, IData>, data: IData): Promise<InstanceType<Class>> {
		let item: InstanceType<Class>;
		let isNewItem = false;

		if(this.items.length >= this.max_items) {
			item = this.items.splice(0, 1)[0];
		} else {
			item = new this.Class() as InstanceType<Class>;
			isNewItem = true;
		}

		await this.setup(item, data, isNewItem);

		if(isNewItem) this.emit('create:new', item, data);
		else this.emit('create:renew', item, data);

		this.emit('create', item, data, isNewItem);

		this.items.push(item);

		return item;
	}

	public delete(id: string): boolean {
		const item = this.items.find(o => o.id === id);
		if(!item) return false;

		this['@deleteing'].emit(item);

		const l = this.items.indexOf(item);
		this.items.splice(l, 1);

		this['@deleted'].emit(id);

		return true;
	}
}
