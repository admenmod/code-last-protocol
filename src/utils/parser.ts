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

const separator = rgx(regexp`[${TAB}${SPACE}${NEW_LINE}]+`()).then(([sep]) => sep);
const node = rgx(regexp`\\(.*)(?=${NEW_LINE})|([^${TAB}${SPACE}${NEW_LINE}]+)`()).then(([, node1, node2]) => node1 || node2);

export const parse_tree = <T>(acc: (ctx: T, node: string) => T, tree: T) => new Pattern<T>((string: string) => {
	const _res = rep(any(node, separator)).exec(string);
	if(!_res || _res.end !== string.length) throw new Error('invalid "tree"');

	const res = _res.res;
	if(res[0] && /\s/.test(res[0])) throw new Error('invalid "tree"');

	const chain = [tree];
	const level = [0];
	let tabs = 0;

	for(let i = 0; i < res.length; i++) {
		const token = res[i];

		if(i % 2) {
			if(token === SPACE) level[tabs]++;
			else if(token[0] === NEW_LINE) {
				tabs = 0; for(let i = 1; i < token.length; i++) if(token[i] === TAB) tabs += 1;
				level.length = tabs+1;
				for(let i = 0; i < level.length; i++) if(typeof level[i] === 'undefined') level[i] = 0;
				level[level.length-1] = 0;
			} else throw new Error('lvl error');
		} else {
			const lvl = getLvl(level, tabs);
			// log(token, 'l', lvl, 't', tabs, 's', [...level], ...chain.map(it => Object.keys(it)));
			chain[lvl+1] = acc(chain[lvl], token);
		}
	}

	return { res: tree, end: string.length };
});


export type RecRec = { [K: string]: RecRec; };
export type ArrArr = [string, TreeStruct[]];
export type TreeStruct = { node: string, tree: TreeStruct }[];

export const tree_to_TreeStruct = parse_tree<TreeStruct>((ctx, node) => (ctx.push({ node, tree: [] }), ctx.at(-1)!.tree), [])

export const tree_to_json = parse_tree<RecRec>((ctx, node) => ctx[node] = Object.create(null), {})
console.log('tree', JSON.stringify(log(tree_to_json.exec(
`main view
	div1 aaa1 vvv1
		cont1.1 cont1.2 cont1.3
	div2 aaa2 vvv2
		cont2.1 cont2.2 cont2.3
`)!.res), null, '  '));
