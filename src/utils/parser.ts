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

const control = rgx(regexp`${SPACE}|${NEW_LINE}\S?${TAB}+|${NEW_LINE}|\S${TAB}+`()).then(([value]) => ({ value, type: 'control' as const }));
const plane_node = rgx(regexp`[^${TAB}${SPACE}${NEW_LINE}]+`()).then(([value]) => ({ value, type: 'node' as const }));
const data_node = rgx(regexp`\\(.*)(?=${NEW_LINE})`()).then(([, value]) => ({ value, type: 'data' as const}));
const tree_token = any(control, data_node, plane_node);

type acc<T> = (ctx: T, token: { type: 'node' | 'data', value: string, group: string }) => T;
export const parse_tree = <T>(acc: acc<T>, get_tree: () => T) => new Pattern<T>((string: string) => {
	const tree = get_tree();
	const _res = rep(tree_token).exec(string);
	if(!_res || _res.end !== string.length) throw new Error(`invalid "tree" ${_res?.end || 0}/${string.length}`);
	const res = _res.res;

	const stack = [tree];
	const level = [0];
	let tabs = 0;
	let group = '';

	for(let i = 0; i < res.length; i++) {
		let { type, value } = res[i];

		if(type === 'control') {
			if(value === SPACE) level[tabs]++;
			else if(value[0] === NEW_LINE) {
				value = value.replace(/\n+/y, '\n');
				tabs = 0;
				let i = value[1] === TAB ? 1 : 2;
				group = value[1] !== TAB && value[2] === TAB ? value[1] : '';
				for(; i < value.length; i++) if(value[i] === TAB) tabs += 1;
				level.length = tabs;
				for(let i = 0; i < level.length; i++) if(typeof level[i] === 'undefined') level[i] = 0;
				level[level.length] = 0;
			} else throw new Error('lvl error');
		} else {
			const lvl = getLvl(level, tabs);
			stack[lvl+1] = acc(stack[lvl], { type, group, value });
		}
	}

	return { res: tree, end: string.length };
});


export type RecRec = { type: 'node' | 'data', group: string, tree: Record<string, RecRec> };
export type TreeStruct = { type: 'node' | 'data', value: string, group: string, tree: TreeStruct }[];

export const tree_to_TreeStruct = parse_tree<TreeStruct>((ctx, { type, group, value }) => {
	ctx.push({ type, group, value, tree: [] });
	return ctx.at(-1)!.tree;
}, () => []);

export const conv = (_tree: TreeStruct): any => {
	const o = Object.create(null);
	for(const { group, value, tree } of _tree) o[`${group}${value}`] = conv(tree);
	return o;
}

// log('tree', JSON.stringify(log(conv(log('row', tree_to_TreeStruct.exec(
// `1111 wkkw
// 	skksks wlwk
// 2222 sksk
// 	skkss
//
// main view
// 	div1 aaa1
// 		cont1.1
// 	div2 aaa2
// 		cont2.1
// `)!.res))), null, '  '));
