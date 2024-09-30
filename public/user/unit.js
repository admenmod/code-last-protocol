/*  NOTE:
 * извиняюсь за ужасный интерфейс, именно изза этого я ненавижу css 
 * базовые конструкции - entry_points, события, сценарии
 * происходит какое то событие -> запускается сценари[йи]
 * скрипты могут быть цикличными, скрипт проверяет данные -> вызывает событие
*/

if(!memory.base_position) memory.base_position = new Vector2();

// ENTRY_POINTS //
function __start__() {
	script.mono(main).run();
	script.mono(detectEnemy).run();
}
function __transfer__(req, reply) {
	if(req.memory.role === 'transfer') return reply.allow();
}
function __order__(order) {
	if(order === 'moveToBase') {
		script.mono(main).reset();
		script.mono(moveToBase).run();
	}

	return ERR_UNKNOWN_ORDER;
}

// CUSTOM_EVENTS //
on('enemy detected', async () => {
	script.mono(main).reset();
	script.mono(detectEnemy).stop();

	await script.mono(moveToBase).run();

	script.mono(main).run();
	script.mono(detectEnemy).start();
});

// CUSTOM_SCRIPTS //
function* main() {
	while(true) {
		if(cargo_filled) yield* moveToBase();
		else yield* searchAndExtractResource();
	}
}

function* moveToBase() {
	yield* moveTo(memory.base_position);
	yield* transfer(base_position, ALL);
}

function* detectEnemy() {
	while(true) {
		const data = yield *scan();
		const enemys = data.filter(({ units }) => units.some(it => it.team === 'enemy'));

		if(enemys.length !== 0) return emit('enemy detected');
	}
}

function* searchAndExtractResource() {
	const data = yield* scan();
	const resource = data.find(it => it.cell.resource > 0);

	if(!resource) {
		if(Math.random() < 0.2) yield* turn(1);
		else if(Math.random() < 0.2) yield* turn(-1);

		if(ERR_BIG_DIFF_HEIGHT === (yield* moveForward(3))) yield* turn(1);
	} else {
		yield* moveTo(resource.pos);

		while(!cargo_filled) {
			if(yield* extract(resource)) continue;
			else break;
		}
	}
}


/*
class BaseNode extends mixin(EventDispather, Array) {
	'#attr'= {};
	$(str, ...args) {}
}

class QMyView extends BaseNode {
	'@submit_form' = new Event();
}

class MyView extends $({ View, Input, Button })
`$(attr_gui = is_gui) : View(attr_gui) {
	name'w
	is_gui'r

	form = View() {
		preview = View() {
			$.name_preview
			$.isValidPassword
		}

		name = Input(value <=> $.name)
		password = Input(value <=> $.password)
	}

	submit = Button(title = 'submit', @click => @submit_form)
}` {
	constructor() {}
}

class MyController extends Q.MyController {
	;
}

class MyView extends Q.MyView {
	@atom name(next = '') { return next; }

	@atom submit_node() {
		return this.$`form/preview`.$`../../submit`;
	}

	@atom preview_node() {
		return this.$`form/preview`[0];
	}
}
*/
