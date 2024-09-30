import { Event, EventDispatcher } from 'ver/events';
import { log, prototype_chain, tag } from 'ver/helpers';
import { codeShell } from 'ver/codeShell';

import { react } from './core';
import { TreeStruct, tree_to_TreeStruct } from '@/utils/parser2';

tree_to_TreeStruct

// const toTreePrimitive = (str: string) => {
// 	if(str === '*') record(str);
//
// 	if(str === 'true' || str === 'false' || str === 'null') return str;
// 	if(!Number.isNaN(+str)) return str;
//
// 	return `\`${str}\``;
// };
//
//
// const $ = (env: Record<string, any>) => {
// 	return (str: TemplateStringsArray, ...args: void[]) => {
// 		const tmp = tag.raw(str, ...args);
// 		const { res: tree } = tree_to_TreeStruct.exec(tmp)!;
//
// 		const feilds_str = (id: string, tree: TreeStruct) => `${id} = ${toTreePrimitive(tree[0].node)};`;
//
// 		const class_str = (name: string, tree: TreeStruct): string => {
// 			const extend_class = tree[0].node;
// 			const feilds = tree[0].tree.map(({ node, tree }) => feilds_str(node, tree)).join('\n');
// 			return `return { ${name}: class ${name} extends ${extend_class} { ${feilds} } }`;
// 		};
//
// 		const code = tree.map(({ node, tree }) => class_str(node, tree)).join('\n\n');
//
// 		return codeShell(code, env, { insulate: false }).call(null);
// 	};
// };


// const C = $({ view: class {} })
// `Main View
// 	attr *
// *		hidden true
// *		layer \gui
// 	sub /
// /		Name <= View
// /		Password <= View
// `;
// console.log(C);


const EVENT_TAG = Symbol('EVENT_TAG');
const DESTRUCTOR = Symbol('DESTRUCTOR');

class Base extends EventDispatcher {
	// '#attrs';
	// '@events';
	// '%property';

	[EVENT_TAG] = Symbol(this.constructor.name);

	[DESTRUCTOR]() {
		[this, prototype_chain(this, )];
	}
}



class QGun extends Base {
	public '@shoot' = new Event<QGun, [damage: number]>(this);

	@react public damage(next = 1) { return next; }
}

class Gun extends QGun {
	public shoot(this: Gun) {
		this.emit('shoot', this.damage());
	}
}

class QPlayer extends Base {
	public '@shoot' = new Event<QPlayer, [damage: number]>(this);

	@react public HP(next = 10) { return next; }
	@react public damage(next = 0) { return next; }

	@react public gun(this: QPlayer) {
		const o = new Gun();
		o.damage = () => this.damage();
		o.on('shoot', (...args: any) => this.emit('shoot', ...args), 0, this[EVENT_TAG]);
		return o;
	}

	destructor() {
		this.gun().off('shoot', this[EVENT_TAG]);
	}
}

class Player extends QPlayer {
	constructor() { super();
		(this as Player).on('shoot', damage => this.HP(this.HP() - damage));
	}

	override destructor() { 
		(this as Player).off('shoot');
	}

	public draw_player() {
		const HP = this.HP();
	}
}


class QPreviewPlayer extends Base {
	@react public player_hp(next = 'v') { return next; }

	@react public div() {
		const o = new View();
		o.sub = () => [this.player_hp()];
		return o;
	}

	@react public sub() { return [this.div()] }
}


console.log(Object.getOwnPropertyNames(EventDispatcher));
console.log({ EventDispatcher });

export class View extends Base {
	#element = document.createElement('div');
	public get element() { return this.#element; }

	@react public sub() { return [] as (string | View)[]; }
}
