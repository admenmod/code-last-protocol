import { List } from 'ver/List';
import { Event, EventDispatcher } from 'ver/events';


// const parseHistoryFile = (string_data: string) => {
// 	let list: List<string> | null = null;
// 	const reg = /(.*)?\n/;
//
// 	let data: RegExpExecArray | null; while(data = reg.exec(string_data)) {
// 		const [, str] = data;
// 		list = List.join(new List(str), list);
// 	}
//
// 	return list;
// };

export class Terminal extends EventDispatcher {
	public '@update' = new Event<Terminal, [input: string, data: unknown]>(this);

	public logs: string[] = [];
	public history: string[] = [];
	public logs_maxsize: number = 5;

	constructor(public shell: (input: string, println: (...args: any[]) => any) => unknown, history: string = '') {
		super();
		this.history.unshift(...history.split('\n'));
	}

	public println = (...args: any[]) => (this.logs.push(args.join(' ')), args.at(-1));

	public write(input: string): unknown {
		if(typeof input === 'undefined') return;

		const data = this.shell(input, this.println);

		if(input !== '') this.history.push(input);
		else this.logs.push('\n');


		this['@update'].emit(input, data);
		return data;
	}
}
