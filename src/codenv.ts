import { EventDispatcher } from 'ver/events';
import { IBlueprint } from '@/game/types';

export const codenv = new class CodeEnv extends EventDispatcher {
	public blueprints: Record<string, IBlueprint> = {};
}
