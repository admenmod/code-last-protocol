import { render } from 'preact';
import { atom } from 'nanostores';
import { FunctionIsEvent } from 'ver/events';
import { window_resize, before_unload } from '@/global-events';

import * as Scene_menu from '@/app/menu';
import * as Scene_game from '@/app/game';
import * as Scene_settings from '@/app/settings';


export const $is_fullscreen = atom(false);
window_resize.on(() => $is_fullscreen.set(Boolean(document.fullscreenElement)));

const app = document.querySelector<HTMLDivElement>('#app')!;
//@ts-ignore
window.ondblclick = () => app.webkitRequestFullscreen();

export type scene_name = keyof typeof scenes;
export const scenes = {
	menu: Scene_menu,
	game: Scene_game,
	settings: Scene_settings
} as const;
export const $selected_scene_name = atom<scene_name>('menu');

$selected_scene_name.listen((value, prev) => {
	$stop.emit(prev);
	$start.emit(value);
});

export const $start: FunctionIsEvent<null, [name: scene_name], (name: scene_name) => unknown> =
new FunctionIsEvent(null, name => {
	const GUI = scenes[name].GUI;
	render(<GUI />, document.querySelector<HTMLDivElement>('#GUI')!);
	$selected_scene_name.set(name);
});

export const $stop: FunctionIsEvent<null, [name: scene_name], (name: scene_name) => unknown> =
new FunctionIsEvent(null, name => $stop.emit(name));


$stop.on(name => scenes[name].exit());
$start.on(name => scenes[name].init());

before_unload.on(() => void scenes[$selected_scene_name.get()].exit());

$start($selected_scene_name.get());
