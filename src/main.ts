import './assets/main.css';
import './init';

import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createHead } from '@unhead/vue/client';

import App from './App.vue';
import { router } from './router';


const app = createApp(App);

app.use(createHead());
app.use(createPinia());
app.use(router);

app.mount('#GUI');
