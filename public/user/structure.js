/*
Было принято решение разделить проект на разные части - демо версии
Ключевые направления:
- User codeing - В этой версии будет прорабатыватся система программирования для пользователя (на сильно упрощенных механиках основной игры)
- Blueprint, schemes, custom modules - В этой версии будет прораьатыватся система чертежей, системы строительства и более сложной реализации модулей (на более примитивной системе программирования пользователем, большая часть будет управлятся через gui)
*/

/*
db:

ui blueprint [blueprint:id, module's]

ui schemes - build mode (size, pos)

ui build [blueprint:id]
*/

yield* blueprint.dev('hover1', [
	SCAN(100),
	CARGO(100),
	ENGIEN(100),
	EXTRACT(100)
]);

// schemes.add('hover1', [192, 252], ['!1']);
// const scheme = Scheme('hover1', [23, 323], ['!1']);
// schemes.add(scheme);

gui.on('spawn', async () => {
	const status = await Script(build('hover1')).run();
	if(isError(status)) console.log(status);
});

function __start__() {
	;
}
