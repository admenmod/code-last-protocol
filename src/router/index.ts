import { createRouter, createWebHistory } from 'vue-router'


export const router = createRouter({
	history: createWebHistory(import.meta.env.BASE_URL),
	routes: [
		{ path: '/', name: 'home', component: () => import('../views/HomeView.vue') },
		{ path: '/menu', name: 'menu', component: () => import('../views/MenuView.vue') },
		{ path: '/game', name: 'game', component: () => import('../views/GameView.vue') }
	]
});
