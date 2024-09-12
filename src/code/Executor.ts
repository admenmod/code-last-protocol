import { List } from 'ver/List';
import { EventDispatcher } from 'ver/events';
import { Script } from '@/ScriptsSystem';


const MIN_TIME = 1;

export class Task {
	public dt: number = 0;
	public done: boolean = false;
	public broken: boolean = false;
	constructor(public owner: Script<any, any, any>, public readonly time: number, public cb: () => any) {}
}

export class Executor extends EventDispatcher {
	public tasks: List<Task> | null = null;

	public addTask(time: number, task: () => unknown) {
		if(time < 0 || time < MIN_TIME) throw new Error('The time cannot be zero or less MIN_TIME');
	}

	public tick(dt: number) {
		main: for(let i = 0; i < 100; i++) {
			let tasks = this.tasks;
			if(!tasks) return;

			let task = tasks.value;
			if(!task.owner.isStart) continue main;

			task.dt += dt;
			if(task.dt < task.time) continue main;

			let delta = dt;

			while(true) {
				if(!task.owner.isStart) continue main;

				task.cb();

				task.dt -= task.time;

				tasks = tasks.next;
				if(!tasks) return;

				task = tasks.value;
				if(!task.owner.isStart) continue main;

				if(task.dt >= task.time) {
					delta = 0;
					continue;
				}

				return;
			}
		}
	}
}



/*
	Evaluetor -> scripts_system -> task -> Executor -> api
*/
