function __start__() {
	;
}
function __transfer__(req, reply) {
	if(req.memory.role === 'transfer') return reply.allow();
}
function __unit_conneted__(unit, unit_public_scripts) {
	if(memory.units_role.get(unit).type === 'harvester') {
		if(memory.enemy_detected) unit.overrideOrder(moveInToBase, unit);
		if(unit_public_scripts.ping) unit.injectOrder(unit_public_scripts.ping);
	}
}

function* moveInToBase(unit) {
	yield* unit.c.moveTo(this.position);
	yield* unit.c.entryInStructure(this);
}
