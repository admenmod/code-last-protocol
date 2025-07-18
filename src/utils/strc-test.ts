import { Vector2 } from 'ver/Vector2';
import { sm } from './strc';
import { array, Include, number, object, string, vector2, } from './strc-types';



export namespace __$__ {
	let dd = sm.type('dd', [
		'1', (v): v is Include<'one'> => !!v
	], [
		'2', (v): v is Include<'two'> => !!v
	], [
		'3', (v): v is { a: 3 } => !!v
	]);

	let dd_: sm.infer<typeof dd>;


	const ctx = () => __$__;

	let loo = array('s', [number, number.as(92)]);

	let loo_: sm.infer<typeof loo> = [1, 92];

	let kakaka = string.as('Strong', 'skwjjs');
	let kskskdjdke: sm.infer<typeof kakaka> = 'skwjjs';

	export let o_lof = object('', {
		// loo: 0 as any as typeof loo,
		lit_string: string.as('string', 'skwjjs'),
		any_number: number,
		kk: sm.Ref(ctx, 'o_lof')
	}/* , ['', (v): v is { k: 3 } => true], ['', (v): v is { ks: 'ss' } => true] */);

	export let aaaa: sm.infer<typeof o_lof> = {
		any_number: 2,
		lit_string: 'skwjjs',

		kk: {
			any_number: 3,
			lit_string: 'string',
			kk: 0 as any as sm.infer<typeof o_lof>
		}
	};

	export let loop = object('object name - type', {
		lit_number: number.as(32, 92, 92),
		any_string: string,
		size: vector2,
		o_lof: sm.Ref(ctx, 'o_lof'),
		sub_object: {
			lit_string: string.as('string', 'skwjjs'),
			any_number: number
		}
	});
	// }, ['', (v): v is { o_lof: Model.Type<typeof o_lof> } => o_lof.parse(v)]);

	let a: any;
	if(loop.parse(a)) {
		// a.self.self.self;
		// a.o_lof.lit_string;
		// let aa = a.o_lof.lit_string;
		// let ss = a.self.sub_object.self.lit_number;
	}

	const ty: sm.infer<typeof loop> = {
		any_string: 'wkkws',
		lit_number: 32,
		size: new Vector2(),
		o_lof: 0 as any as sm.infer<typeof o_lof>,
		sub_object: {
			any_number: 82,
			lit_string: 'skwjjs'
		}
	};

	(a: any) => {
		if(sm.type('',
			['', (v): v is unknown => typeof v === 'number'],
			['Include "move"', (v): v is Include<'move'> => v.includes('move')],
			['Include "cargo"', (v): v is Include<'cargo'> => v.includes('cargo')]
		).parse(a)) {
			a;
			let aa = a[3];
		}
	}
}
