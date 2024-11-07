import { FunctionIsEvent } from 'ver/events';
import { APIResult, Executor } from '@/code/Executor';
import { Entity } from '@/game/Entity';


export declare namespace Module {
	interface IOwner extends Entity {}
}


export abstract class Module<const ID extends string, T extends Module.IOwner, const P extends object = {}> extends Executor {
	public isReady: boolean = false;
	public ready = new FunctionIsEvent<Module<ID, T, P>, [], () => Promise<boolean>>(this, async () => {
		if(this.isReady) return false;
		this.ready.emit();
		this.isReady = true;
		return true;
	});

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
