import { EventDispatcher, FunctionIsEvent } from 'ver/events';
import { math as Math } from 'ver/helpers';
import { Animation } from 'ver/Animation';


export function* repeat(cb: (dt: number) => unknown, count: number, timeout: number) {
	for(let i = 0; i < count; i++) cb(yield timeout);
}

export function* c(cb: (c: number) => unknown, time: number, step: number, m = (c: number) => c): Animation.Iterator {
	let t = 0;

	cb(0);
	while(t < time) {
		cb(Math.clamp(-1, m(t / time), 1));
		t += yield step;
	}
	cb(1);
}


export const pipe = async (...anims: Animation<[]>[]) => {
	for(const anim of anims) await anim.run();
};


export class AnimationManager extends EventDispatcher {
	public anims: Animation<any>[] = [];

	public reg<T extends Animation<any>>(anim: T): T {
		(anim as Animation<any[]>).on('run', () => this.anims.push(anim));

		(anim as Animation<any[]>).on('reset', () => {
			const l = this.anims.indexOf(anim);
			if(!~l) return;
			this.anims.splice(l, 1);
		});

		return anim;
	}

	public run<const Args extends any[]>(gen: Animation.Generator<Args>, ...args: Args): Animation<Args> {
		const anim = new Animation(gen);
		this.anims.push(anim);

		anim.run(...args).then(() => this.del(gen));

		return anim;
	}

	public del<T extends any[]>(gen: Animation.Generator<T>): void {
		const l = this.anims.findIndex(it => it.generator === gen);
		if(!~l) return;
		this.anims.splice(l, 1);
	}
}


import { codeShell } from 'ver/codeShell';
import { KeyboardInputInterceptor } from 'ver/KeyboardInputInterceptor';


const env = new Proxy(Object.create(null), {
	has: (_, p) => {
		return Boolean(Value.arr.find(it => it.id === p));
	},
	get: (_, p) => {
		const it = Value.arr.find(it => it.id === p);
		if(!it) return;

		if(!Value.bufDep.includes(it)) Value.bufDep.push(it);
		return it.value;
	}
});


// NOTE: add priority update
class Value<T> {
	public static arr: Value<any>[] = [];
	public static bufDep: Value<any>[] = [];


	protected _value: T;
	public get value() { return this._value; }
	public set value(v) { this.edit(v); }

	public isEdited: boolean = false;

	public edit: FunctionIsEvent<null, [value: T], (value: T) => void> = new FunctionIsEvent(null, value => {
		this._value = value;

		this.isEdited = false;

		this.edit.emit(value);
		return this.value;
	});

	public code: string;
	public deps: Value<T>[] = [];

	constructor(public id: string, value: T, code: string) {
		this._value = value;
		this.code = code;

		Value.arr.push(this);
	}

	protected upDeps() {
		this.deps.length = 0;
		this.deps.push(...Value.bufDep);

		// for(const dep of this.deps) if(dep !== this) dep.edit.once(() => this.exec(), 0, this.id);

		for(const dep of this.deps) dep.isEdited = true;
		this.edit.once(() => {
			for(const dep of this.deps) if(dep !== this && dep.isEdited) dep.exec();
		});

		Value.bufDep.length = 0;
	}

	public exec() {
		this.isEdited = false;
		this.value = codeShell<() => T>(`return (${this.code})`, env, { insulate: false }).call(null);
		this.upDeps();
	}

	public toString() { return `${this.id}: ${this.value} [${this.code}]`; }
}


/*
{
const c = new Value('c', 10, `c`);
const x = new Value('x', 1, `y * c`);
const y = new Value('y', 2, `x / c`);

c.exec();
x.exec();
console.log('deps.x', Object.fromEntries(x.deps.map(it => [it.id, it.toString()])));
console.log('deps.y', Object.fromEntries(y.deps.map(it => [it.id, it.toString()])));
y.exec();
console.log('deps.x', Object.fromEntries(x.deps.map(it => [it.id, it.toString()])));
console.log('deps.y', Object.fromEntries(y.deps.map(it => [it.id, it.toString()])));

console.log('======');
console.log(Value.arr.map(it => it.toString()));
console.log('deps', Object.fromEntries(x.deps.map(it => [it.id, it.toString()])));
x.edit(3);
console.log('======');
console.log(Value.arr.map(it => it.toString()));
y.edit(5);
console.log('======');
console.log(Value.arr.map(it => it.toString()));
c.edit(2);
console.log('======');
console.log(Value.arr.map(it => it.toString()));
}


export class Input {
	public blur: FunctionIsEvent<null, [], () => void> = new FunctionIsEvent(null, () => {
		this.input.blur();
	});
	public focus: FunctionIsEvent<null, [], () => void> = new FunctionIsEvent(null, () => {
		this.input.focus();
	});

	public input = document.createElement('input');
	public kii = new KeyboardInputInterceptor().init(this.input);

	constructor() {
		this.input.type = 'text';
		this.input.inputMode = 'search';

		this.input.onblur = () => this.blur.emit();
		this.input.onfocus = () => this.focus.emit();
	}
}
*/


// const root_gui = document.body.querySelector('#GUI')!;
//
// const input1 = new Input();
// root_gui.append(input1.input);
//
// const input2 = new Input();
// root_gui.append(input2.input);
//
// const input3 = new Input();
// root_gui.append(input3.input);



// 12644
