import { Event, EventDispatcher } from 'ver/events';


export interface APIResult<T> {
	time: number | null;
	task: (dt: number) => T;
	cache: 'TASK_LAST_LINK' | void;
}

const MIN_TIME = 1;

export class Task<T = any> implements PromiseLike<T> {
	public dt: number = 0;
	public done: boolean = false;
	public broken: boolean = false;

	public promise: Promise<T>;
	public resolve: (value: T) => void;

	constructor(public readonly time: number | null, public cb: (dt: number) => T) {
		const { promise, resolve } = Promise.withResolvers<T>();
		this.promise = promise;
		this.resolve = resolve;
	}

	public make(dt: number): this {
		if(this.done) return this;

		this.resolve(this.cb(dt));
		this.done = true;

		return this;
	}

	public then<T1 = T, T2 = never>(
		onfulfilled?: ((value: T) => T1 | PromiseLike<T1>) | null | undefined,
		onrejected?: ((reason: any) => T2 | PromiseLike<T2>) | null | undefined
	): PromiseLike<T1 | T2> {
		return this.promise.then(onfulfilled, onrejected);
	}

	public get [Symbol.toStringTag]() { return 'Task'; }
}

export class Executor extends EventDispatcher {
	public '@chain' = new Event<Executor, []>(this);


	public tasks: Task[] = [];

	constructor(public API: Record<string, (...args: any) => APIResult<any>>) {
		super();
	}

	public request(id: string, ...args: any) {
		if(!(id in this.API)) throw new Error('invalid request api');

		return this.addTask(this.API[id](...args));
	}

	public addTask<T>({ time, cache, task }: APIResult<T>): Task<T> {
		if(time !== null && (time < 0 || time < MIN_TIME)) throw new Error('The time cannot be zero or less MIN_TIME');

		let o: Task;

		if(cache === 'TASK_LAST_LINK' && this.tasks.length) o = this.tasks[0];
		else {
			o = new Task<T>(time, task);
			this.tasks.push(o);
		}

		this['@chain'].emit();

		return o;
	}

	public tick(dt: number) {
		if(!this.tasks.length) return;
		let task = this.tasks[0];

		if(task.time === null) return this.resolveTask(task, dt);

		task.dt += dt;
		if(task.dt < task.time) return;

		let delta = dt;

		while(true) {
			this.resolveTask(task, delta);

			if(task.time === null) return;
			task.dt -= task.time;

			if(!this.tasks.length) return;
			task = this.tasks[0]!;

			if(task.time === null) continue;
			if(task.dt >= task.time) {
				delta = 0;
				continue;
			}

			return;
		}
	}

	public resolveTask(task: Task<any>, delta: number) {
		task.make(delta);

		this.tasks.shift();
		this['@chain'].emit();
	}
}
