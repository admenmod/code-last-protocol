import { Event } from 'ver/events';

export const createStateManager = <T extends Record<string, (state: Record<string, boolean>) => boolean>>(accessors: T) => {
	const state = Object.create(null);
	for(const id in accessors) state[id] = false;

	const actualize = (stateId: keyof T) => {
		for(const id in state) {
			if(id !== stateId && state[id] && !accessors[id](state)) (state as any)[id] = false;
		}
		m['@change'].emit();
	};

	const m = Object.create(null);

	for(const id in state) {
		m[id] = (value?: T[typeof id]) => {
			if(typeof value === 'undefined') return state[id];
			if(value === state[id]) return state[id];
			const f = accessors[id](state);
			if(f) state[id] = value;
			if(f) actualize(id);
			return f && value;
		};
	}

	m['@change'] = new Event(null);

	return m as {
		[K in keyof T]: (value?: T[K]) => boolean;
	} & { '@change': Event<null, []> };
};
