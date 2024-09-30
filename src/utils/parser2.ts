import { log, regexp } from 'ver/helpers';
import { Pattern, any, rep, rgx } from 'ver/string';


const TAB = '\t';
const SPACE = ' ';
const NEW_LINE = '\n';

const getLvl = (level: number[], tabs: number) => {
	let acc = 0;
	for(let i = 0; i < tabs+1; i++) acc += level[i];
	return acc + tabs;
};

const control = rgx(regexp`${SPACE}|${NEW_LINE}\S?${TAB}+|${NEW_LINE}`()).then(([value]) => ({ value, type: 'control' as const }));
const plane_node = rgx(regexp`[^${TAB}${SPACE}${NEW_LINE}]+`()).then(([value]) => ({ value, type: 'node' as const }));
const data_node = rgx(regexp`\\(.*)(?=${NEW_LINE})`()).then(([, value]) => ({ value, type: 'data' as const}));


type acc<T> = (ctx: T, token: { type: 'node' | 'data', value: string, group: string }) => T;
export const parse_tree = <T>(acc: acc<T>, tree: T) => new Pattern<T>((string: string) => {
	const _res = rep(any(data_node, plane_node, control)).exec(string);
	if(!_res || _res.end !== string.length) throw new Error('invalid "tree"');

	const res = _res.res;
	// if(res[0] && /\s/.test(res[0])) throw new Error('invalid "tree"');

	const chain = [tree];
	const level = [0];
	let tabs = 0;
	let group = '';

	for(let i = 0; i < res.length; i++) {
		const { type, value } = res[i];

		if(type === 'control') {
			// log(type, [value]);

			if(value === SPACE) level[tabs]++;
			else if(value === NEW_LINE) { tabs = 0; group = ''; }
			else if(value[0] === NEW_LINE) {
				tabs = 0;
				let i = value[1] === TAB ? 1 : 2;
				log(chain.at(-1), group);
				group = value[1] !== TAB && value[2] === TAB ? value[1] : '';
				for(; i < value.length; i++) if(value[i] === TAB) tabs += 1;
				level.length = tabs+1;
				for(let i = 0; i < level.length; i++) if(typeof level[i] === 'undefined') level[i] = 0;
				level[level.length-1] = 0;
			} else throw new Error('lvl error');
		} else {
			const lvl = getLvl(level, tabs);
			chain[lvl+1] = acc(chain[lvl], { type, group, value });
		}
	}

	return { res: tree, end: string.length };
});


export type RecRec = { type: 'node' | 'data', group: string, tree: Record<string, RecRec> };
export type TreeStruct = { type: 'node' | 'data', value: string, group: string, tree: TreeStruct }[];

export const tree_to_TreeStruct = parse_tree<TreeStruct>((ctx, { type, group, value }) => {
	ctx.push({ type, group, value, tree: [] });
	return ctx.at(-1)!.tree;
}, []);

export const tree_to_json = parse_tree<RecRec>((ctx, { type, group, value }) => ctx.tree[value] = {
	type, group, tree: Object.create(null)
}, { tree: Object.create(null), type: 'node', group: '' })

const conv = ({ type, group, tree }: any): any => {
	const o = Object.create(null);
	for(const id in tree) o[`(${tree[id].group})[${id}]`] = conv(tree[id]);
	return o;
}

log('tree', JSON.stringify(log(conv(log('row', tree_to_json.exec(
`main view
%	div1 aaa1 vvv1
%		cont1.1 cont1.2 cont1.3
	div2 aaa2 vvv2
*		cont2.1 cont2.2 cont2.3
`)!.res))), null, '  '));
