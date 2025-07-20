import { Vector2 } from 'ver/Vector2';
import { st } from 'ver/super-type';
import { Include, number, object, or, string, vector2, } from './strc-types';


export namespace __$__ {
	let dd = st.and(
		(v): v is Include<'one'> => !!v,
		(v): v is Include<'two'> => !!v,
		(v): v is { a: 3 } => !!v
	);

	let dd_: st.infer<typeof dd>;


	const ctx = () => __$__;

	// let loo = array('s', [number, or(92)]);
	//
	// let loo_: sm.infer<typeof loo> = [1, 92];

	let kakaka = or('Strong', 'skwjjs');
	let kskskdjdke: st.infer<typeof kakaka> = 'skwjjs';

	export let o_lof = object({
		// loo: 0 as any as typeof loo,
		lit_string: or('string', 'skwjjs'),
		any_number: number,
		kk: st.Ref(ctx, 'o_lof')
	}/* , ['', (v): v is { k: 3 } => true], ['', (v): v is { ks: 'ss' } => true] */);

	export let aaaa: st.infer<typeof o_lof> = {
		any_number: 2,
		lit_string: 'skwjjs',


		kk: {
			any_number: 3,
			lit_string: 'string',
			kk: 0 as any as st.infer<typeof o_lof>
		}
	};

	export let loop = object({
		lit_number: or(32, 92, 92),
		any_string: string,
		size: vector2,
		o_lof: st.Ref(ctx, 'o_lof'),
		sub_object: {
			lit_string: or('string', 'skwjjs'),
			any_number: number
		}
	});
	// }, ['', (v): v is { o_lof: Model.Type<typeof o_lof> } => o_lof.parse(v)]);

	let a: any;
	if(st.parse(loop, a)) {
		// a.self.self.self;
		// a.o_lof.lit_string;
		// let aa = a.o_lof.lit_string;
		// let ss = a.self.sub_object.self.lit_number;
	}

	const ty: st.infer<typeof loop> = {
		any_string: 'wkkws',
		lit_number: 32,
		size: new Vector2(),
		o_lof: 0 as any as st.infer<typeof o_lof>,
		sub_object: {
			any_number: 82,
			lit_string: 'skwjjs'
		}
	};

	let _aaaa = <const T extends any[]>(t: T) => t;
	let aaa = _aaaa([{
		o: 82
	}, [9]]);

	(a: any) => {
		if(st.parse(st.and(
			(v): v is unknown => typeof v === 'number',
			(v): v is { a: 7 } => typeof v === 'number',
			(v): v is Include<'move'> => v.includes('move'),
			(v): v is Include<'cargo'> => v.includes('cargo')
		), a)) {
			a;
		}
	}
}
