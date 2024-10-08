import { Event, EventDispatcher } from 'ver/events';
import { log, prototype_chain, tag } from 'ver/helpers';
import { codeShell } from 'ver/codeShell';

import { TreeStruct, conv, tree_to_TreeStruct } from '@/utils/parser';
import 'mol_wire_lib';


const $ = <T = any>(env: Record<string, any>) => {
	return (str: TemplateStringsArray, ...args: void[]) => {
		const tmp = tag.raw(str, ...args);
		const { res: tree } = tree_to_TreeStruct.exec(tmp)!;
		log(2, tree);
		log('tree', JSON.stringify(conv(log(tree)), null, '  '));

		const feilds_str = (token: string, tree: TreeStruct) => {
			const [, name, next] = /(\w+)\??(\w*)/.exec(token)!;
			const value = tree[0].type === 'data' ? '`'+tree[0].value+'`' : tree[0].value;
			return `\t${name}(${next || ''}) { return ${value}; }`;
		};

		const class_str = (name: string, extends_class: string, tree: TreeStruct): string => {
			const feilds = tree.map(({ value, tree }) => feilds_str(value, tree)).join('\n');
			return `class ${name ? name+' ':''}${extends_class ? 'extends '+extends_class+' ':''}{\n${feilds}\n}`;
		};

		const name = tree[0].value;
		const extends_class = tree[0].tree[0]?.value || '';
		const code = class_str(name, extends_class, tree.slice(1));

		const Class = codeShell<() => new (...args: any) => T>(`return ${code}`, env, { insulate: false }).call(null);

		tree.slice(1).map(({ value }) => $mol_mem(Class.prototype, value));

		log(Class);

		return Class;
	};
};

export class View {
	d = 2
}

export class Div extends $({ View })`Div View
attr *
	hidden true
	layer \gui
sub /
	Name <= View
		hint \Name
	Password <= View
` {
	@ $mol_mem sub() { return super.sub() + this.attr(); }
}
console.log(Div);

const c = new Div();
log(c.sub());


const EVENT_TAG = Symbol('EVENT_TAG');
const DESTRUCTOR = Symbol('DESTRUCTOR');

class Base extends EventDispatcher {
	// '#attrs';
	// '@events';
	// '%property';

	destructor() {}

	[EVENT_TAG] = Symbol(this.constructor.name);

	[DESTRUCTOR]() {
		if(Object.hasOwn(this, 'destructor')) this.destructor();
		for(const it of prototype_chain(this, Base)) {
			if(Object.hasOwn(it, 'destructor')) it.destructor();
		}
	}
}



// class QGun extends Base {
// 	public '@shoot' = new Event<QGun, [damage: number]>(this);
//
// 	@react public damage(next = 1) { return next; }
// }
//
// class Gun extends QGun {
// 	public shoot(this: Gun) {
// 		this.emit('shoot', this.damage());
// 	}
// }
//
// class QPlayer extends Base {
// 	public '@shoot' = new Event<QPlayer, [damage: number]>(this);
//
// 	@react public HP(next = 10) { return next; }
// 	@react public damage(next = 0) { return next; }
//
// 	@react public gun(this: QPlayer) {
// 		const o = new Gun();
// 		o.damage = () => this.damage();
// 		o.on('shoot', (...args: any) => this.emit('shoot', ...args), 0, this[EVENT_TAG]);
// 		return o;
// 	}
//
// 	destructor() {
// 		this.gun().off('shoot', this[EVENT_TAG]);
// 	}
// }
//
// class Player extends QPlayer {
// 	constructor() { super();
// 		(this as Player).on('shoot', damage => this.HP(this.HP() - damage));
// 	}
//
// 	override destructor() { 
// 		(this as Player).off('shoot');
// 	}
//
// 	public draw_player() {
// 		const HP = this.HP();
// 	}
// }
//
//
// class QPreviewPlayer extends Base {
// 	@react public player_hp(next = 'v') { return next; }
//
// 	@react public div() {
// 		const o = new View();
// 		o.sub = () => [this.player_hp()];
// 		return o;
// 	}
//
// 	@react public sub() { return [this.div()] }
// }
//
//
// console.log(Object.getOwnPropertyNames(EventDispatcher));
// console.log({ EventDispatcher });
//
// export class View extends Base {
// 	#element = document.createElement('div');
// 	public get element() { return this.#element; }
//
// 	@react public sub() { return [] as (string | View)[]; }
// }
