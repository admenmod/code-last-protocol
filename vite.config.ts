// import os from 'node:os';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';


const port = 3000;
const host = 'localhost';
// (() => {
// 	const nets = os.networkInterfaces();
//
// 	for(const id in nets) {
// 		for(const net of nets[id]!) {
// 			if(net.netmask === '255.255.255.0' && net.family === 'IPv4' && !net.internal) return net.address;
// 		}
// 	}
//
// 	return 'localhost';
// })();


export default defineConfig({
	server: { host, port, hmr: false },
	plugins: [tsconfigPaths(), vue(), vueDevTools()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
			'lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
			'ver': fileURLToPath(new URL('./src/ver', import.meta.url))
		}
	}
});
