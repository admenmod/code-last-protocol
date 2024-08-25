import { Event } from 'ver/events';
import { Scene } from 'ver/Scene';
import { System } from 'ver/System';


export class ProcessSystem extends System<typeof Node> {
	constructor() {
		super(Node);

		const processPriority = () => this._items.sort(this._sort);

		this['@add'].on(item => {
			item.on('change%processPriority', processPriority);
			processPriority();
		});

		this['@removing'].on(item => item.off('change%processPriority', processPriority));
	}

	public _sort(a: Node, b: Node): number { return b.globalProcessPriority - a.globalProcessPriority; }

	public update(dt: number) {
		for(let i = 0; i < this._items.length; i++) {
			this._items[i].process(dt);
		}
	}
}


const PARENT_CACHE = Symbol('PARENT_CACHE');

export class Node extends Scene {
	public '@PreProcess' = new Event<Node, [dt: number]>(this);
	public '@PostProcess' = new Event<Node, [dt: number]>(this);


	protected [PARENT_CACHE]: Node[] = [];

	public '@change%processPriority' = new Event<Node, [Node]>(this);

	private _processPriority: number = 0;

	protected _processPriorityAsRelative: boolean = true;
	public get processPriorityAsRelative() { return this._processPriorityAsRelative; }
	public set processPriorityAsRelative(v) {
		if(v === this._processPriorityAsRelative) return;
		this._processPriorityAsRelative = v;
		this['@change%processPriority'].emit(this);
	}

	public get processPriority() { return this._processPriority; }
	public set processPriority(v) {
		if(this._processPriority = v) return;
		this._processPriority = v;
		this['@change%processPriority'].emit(this);
	}


	constructor() {
		super();

		const ontree = () => {
			this[PARENT_CACHE].length = 0;
			this[PARENT_CACHE].push(...this.getChainParentsOf(Node));
		};

		ontree();

		this['@tree_entered'].on(ontree);
		this['@tree_exiting'].on(ontree);
	}


	public get globalProcessPriority(): number {
		return this.getRelativeProcessPriority(Node.MAX_NESTING, this[PARENT_CACHE]);
	}

	public getRelativeProcessPriority(nl: number = 0, arr: Node[] = this[PARENT_CACHE]): number {
		const l = Math.min(nl, arr.length, Node.MAX_NESTING);
		let acc = this.processPriority;

		if(!this.processPriorityAsRelative) return acc;

		for(let i = 0; i < l; i++) {
			acc += arr[i].processPriority;

			if(!arr[i].processPriorityAsRelative) return acc;
		}

		return acc;
	}


	protected _process(dt: number): void {}

	public process(dt: number): void {
		this['@PreProcess'].emit(dt);
		this._process(dt);
		this['@PostProcess'].emit(dt);
	}

	public static readonly MAX_NESTING = 10000;
}
