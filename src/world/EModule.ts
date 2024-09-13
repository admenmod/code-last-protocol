import { Executor } from '@/code/Executor';

export type API = Record<string, (...args: any) => {
	time: number | null;
	task: (dt: number) => any;
}>;

export abstract class EModule<T> extends Executor {
	constructor(public readonly module_id: string, public owner: T, API: API) {
		super(API);
	}
}
