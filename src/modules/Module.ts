import { APIResult, Executor } from '@/code/Executor';


export declare namespace Module {
	interface IOwner {
		modules: Module<string, IOwner>[]
	}
}


export abstract class Module<const ID extends string, T extends Module.IOwner, const P extends object = {}> extends Executor {
	constructor(
		public readonly id: ID,
		public owner: T,
		public API: Record<string, (module: any, ...args: any) => APIResult<any>>
	) { super(); }

	public request(id: string, ...args: any) {
		if(!(id in this.API)) throw new Error('invalid request api');

		return this.addTask(this.API[id](this, ...args));
	}
}
