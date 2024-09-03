// memory { target: MAP.resources[0] }
//
// ['extract resource'] -> com -> ['move to resource', 'extract resource']
// ['copasity max'] -> com -> ['move to base', 'transfer to base']
//
// [energy, copasity, position, network] -> core(<->com) -> [moveForward, scane, sendMessage]


on('new order', order => {
	c.break();
	c.run(order);
});

on('enemy detected', () => {
	if(CURRENT_ORDER === 'searchAndExtractResource') c.break();
	c.run(moveToBase);
});

function* moveToBase() {
	yield* moveTo(memory.base_position);
}

function* searchAndExtractResource() {
	const data = yield* scan();
	console.log({ data });

	const resource = data.find(it => it.title === 'Resource');

	console.log({ resource });

	if(resource) {
		yield* moveTo(resource);
		while(!cargo_filled) yield* extract(resource);
	}

	yield* moveForward(3);
}


// #(com) base
on('unit conneted', (unit, unit_public_scripts) => {
	if(memory.units_role.get(unit).type === 'harvester') {
		if(memory.enemy_detected) unit.overrideOrder(moveInToBase, unit);

		unit.injectOrder('ping');
	}
});

function* moveInToBase(unit) {
	yield* unit.c.moveTo(this.position);
	yield* unit.c.entryInStructure(this);
}


return function* main() {
	yield { // run next 1
		ajms: 20
	};

	while(true) {
		if(!cargo_filled) yield* c.run(searchAndExtractResource);
		else yield* c.run(moveToBase);
	}
}
