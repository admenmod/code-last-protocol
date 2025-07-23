import { defineStore } from 'pinia';


export const useCounterStore = defineStore('game', {
	state: () => ({
		is_fullscreen: Boolean(document.fullscreenElement)
	}),

	actions: {

	}
});
