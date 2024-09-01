import { Event, EventDispatcher } from 'ver/events';


export namespace Env {
	export abstract class Network<T> extends EventDispatcher {
		public '@change' = new Event<Network<T>, []>(this);

		public arr: T[] = [];
	}

	export class CommunicationNetwork extends Network<{}> {
	}

	export class ElectricalNetwork extends Network<{}> {
	}
}
