export class UnionGroups<T> extends Array<Set<T>> {
	public get(...args: T[]) { return this.find(set => typeof args.find(arg => set.has(arg)) !== 'undefined'); }

	public group(...args: T[]) {
		const set = this.get(...args) || new Set(args);
		const arr = args.filter(it => this.get(it));

		if(set) args.forEach(a => set!.add(a));

		for(let i = this.length-1; i >= 0; i--) {
			for(const it of arr) {
				if(set !== this[i] && this[i].has(it)) this.splice(i, 1);
			}
		}
	}
}
