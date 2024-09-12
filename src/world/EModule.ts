import { Executor } from '@/code/Executor';


export abstract class EModule<T> extends Executor {
	constructor(public readonly module_id: string, public owner: T) {
		super();
	}
}
