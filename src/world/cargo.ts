import { Event, EventDispatcher } from 'ver/events';


export declare namespace Cargo {
	export interface Item {
		title: string;
		bulk: number;
		count: number;
	}
}

type action_type = 'spawn' | 'kill' | 'transfer';

export class Cargo extends EventDispatcher {
	public '@change' = new Event<Cargo, [allowed: Cargo.Item[], error: Cargo.Item[], type: action_type]>(this);

	#items: Cargo.Item[] = [];

	#fullness: number = 0;
	#actual_fullness: boolean = true;
	public get fullness() {
		if(this.#actual_fullness) return this.#fullness;
		this.#actual_fullness = true;

		return this.#fullness = this.#items.reduce((acc, it) => it.count*it.bulk + acc, 0);
	}

	public get fullness_normaloze() { return this.fullness / this.total_size ; }

	constructor(public total_size: number) {
		super();

		this['@change'].on(() => this.#actual_fullness = false);
	}

	public has(item: Cargo.Item): boolean { return this.#items.includes(item); }
	public get(predicate: (it: Cargo.Item, i: number, arr: Cargo.Item[]) => boolean, thisArg?: any) {
		return this.#items.filter(predicate, thisArg);
	}
	public show(predicate: (it: Cargo.Item, i: number, arr: Cargo.Item[]) => boolean, thisArg?: any) {
		return Cargo.copy(this.#items.filter(predicate, thisArg));
	}

	public checkLimit(...items: Cargo.Item[]) {
		const error: Cargo.Item[] = [];
		const allowed: Cargo.Item[] = [];

		for(let i = 0; i < items.length; i++) {
			if(items[i].bulk * items[i].count + this.fullness <= this.total_size) allowed.push(items[i]);
			else error.push(items[i]);
		}

		return { allowed, error };
	}

	public spawn(...items: Cargo.Item[]) {
		const { allowed, error } = this.checkLimit(...items);

		for(let i = 0; i < allowed.length; i++) this.#items.push(allowed[i]);

		this['@change'].emit(Cargo.copy(allowed), Cargo.copy(error), 'spawn');

		return { allowed: Cargo.copy(allowed), error: Cargo.copy(error) };
	}

	public kill(...items: Cargo.Item[]): Cargo.Item[] {
		for(let i = 0; i < items.length; i++) {
			const l = this.#items.indexOf(items[i]);
			if(!~l) throw new Error(`item is not found`);
		}

		this['@change'].emit(items, [], 'kill');

		return items;
	}

	public transfer(cargo: Cargo, predicate: (it: Cargo.Item, i: number, arr: Cargo.Item[]) => boolean, thisArg?: any) {
		const items = this.#items.filter(predicate, thisArg);
		const { allowed, error } = this.checkLimit(...items);

		for(let i = 0; i < allowed.length; i++) {
			cargo.#items.push({
				...this.#items.splice(this.#items.indexOf(allowed[i]), 1)[0]
			});
		}

		this['@change'].emit(Cargo.copy(allowed), Cargo.copy(error), 'transfer');

		return { allowed: Cargo.copy(allowed), error: Cargo.copy(error) };
	}

	public split(item: Cargo.Item, count: number) {
		if(!Number.isInteger(count)) throw new Error('split count is not integer');

		const l = this.#items.indexOf(item);
		if(!~l) throw new Error('item is not found');

		if(item.count <= count) throw new Error('items count <= split count');

		const split = { ...item };
		split.count = count;

		item.count -= count;
		this.#items.push(split);
	}

	public merge(...items: Cargo.Item[]): void;
	public merge(predicate: (it: Cargo.Item, i: number, arr: Cargo.Item[]) => boolean, thisArg?: any): void;
	public merge(...args: any) {
		let items: Cargo.Item[];

		if(typeof args[0] === 'function') items = this.#items.filter(...args as [any, any]);
		else {
			for(let i = 0; i < args.length; i++) if(!this.has(args[i])) throw new Error('item is not found');
			items = args;
		}

		const arr: Cargo.Item[] = [];

		for(let i = items.length-1; i >= 0; --i) {
			const item = arr.find(it => it.title === items[i].title);

			if(item) {
				item.count += items[i].count;
				this.#items.splice(this.#items.indexOf(items[i]), 1);
			} else arr.push(items[i]);
		}
	}

	public static copy(items: Cargo.Item[]) { return items.map(it => ({ ...it })) }
}
