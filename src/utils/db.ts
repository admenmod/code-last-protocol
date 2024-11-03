import { math as Math } from 'ver/helpers';


const filter = /[0-9a-zA-Z]/;

const arr = [...(function* () {
	for(let i = 0; i < 0x100; i++) {
		const c = String.fromCharCode(i);
		if(c.match(filter)) yield c;
	}
})()].join('');

const L = 12;

export const UID = () => Array(L).fill(0).map(() => arr[Math.randomInt(0, arr.length-1)]).join('');
