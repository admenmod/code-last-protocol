import { Event } from 'ver/events';


export const createStateManager = <T extends Record<string, boolean>>(state: T, accessors: {
	[K in keyof T]: (state: T) => boolean;
}) => {
	const actualize = (stateId: keyof T) => {
		for(const id in state) {
			if(id !== stateId && state[id] && !accessors[id](state)) (state as any)[id] = false;
		}
		m['@change'].emit();
	};

	const m = Object.create(null);

	for(const id in state) {
		m[id] = (value: T[typeof id]) => {
			if(value === state[id]) return true;
			const f = accessors[id](state);
			state[id] = value;
			actualize(id);
			return f;
		};
	}

	m['@change'] = new Event(null);

	return m as {
		[K in keyof T]: (value: T[K]) => boolean;
	} & { '@change': Event<null, []> };

;
};
