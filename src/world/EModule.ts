import { APIResult, Executor } from '@/code/Executor';


export abstract class EModule<T> extends Executor {
	constructor(
		public readonly module_id: string,
		public owner: T,
		ENV: Record<string, any>,
		API: Record<string, (...args: any) => APIResult<any>>,
	) { super(ENV, API); }
}
