function __start__() {
	main.run();
	// detect_enemy.run();
}
function __transfer__(req, reply) {
	if(req.memory.role === 'transfer') return reply.allow();
}
function __order__(order) {
	if(order === 'moveToBase') {
		work.reset();
		moveToBase.run();
	}

	return ERR_UNKNOWN_ORDER;
}


on('enemy detected', async () => {
	detect_enemy.stop();
	main.reset();

	await moveToBase.run();

	detect_enemy.start();
	main.run();
});


const main = coroutin(function* main() {
	yield; while(true) {
		if(cargo_filled) yield* moveToBase();
		else yield* searchAndExtractResource();
	}
});

const moveToBase = coroutin(function* () {
	yield* moveTo(memory.base_position);
	yield* transfer(base_position, ALL);
});

const detect_enemy = coroutin(function* () {
	yield; while(true) {
		const data = yield *scan();
		const enemys = data.filter(it => it.type === 'unit' && it.team === 'enemy');

		if(enemys.length !== 0) return emit('enemy detected');
	}
});

const searchAndExtractResource = coroutin(function* () {
	yield;

	const data = yield* scan();
	const resource = data.find(it => it.type === 'cell' && it.values.resource > 0);

	if(!resource) {
		if(Math.random() < 0.2) yield* turn(1);
		else if(Math.random() < 0.2) yield* turn(-1);

		if(!(yield* moveForward(3))) yield* turn(1);
	} else {
		yield* moveTo(resource.pos);

		while(!cargo_filled) {
			if(yield* extract(resource)) continue;
			else break;
		}
	}
});
