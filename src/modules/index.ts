import { z } from 'zod';
import { object } from 'ver/helpers';

export type Default<T, D> = [T] extends [never] ? D : T;


export namespace mod_zod { 'off tree-shaking :)'; }
export namespace mod_env { 'off tree-shaking :)'; }
export namespace modules { 'off tree-shaking :)'; }

export type AnyModule = InstanceType<AnyModuleConstructor>;
export type AnyModuleConstructor = typeof modules[keyof typeof modules];
export type AnyModuleId = keyof typeof modules;
export type ModuleById<T extends AnyModuleId[]> = typeof modules[T[number]];


export type DefaultModulesParams = {};
export type DefaultEntityParams = z.infer<typeof entity_zod_model> & DefaultModulesParams;

export type ModulesParams<T extends AnyModuleId[]> = Default<object.assing<{ [K in keyof T]: z.infer<typeof mod_zod[T[K]]>; }>, {}>;
// let a: ModulesParams<[]>;
export type EntityParams<T extends AnyModuleId[]> = DefaultEntityParams & ModulesParams<T>;

export type AnyModulesParams = ModulesParams<AnyModuleId[]>;
export type AnyEntityParams = EntityParams<AnyModuleId[]>;

export const entity_zod_model = z.object({
	size: z.Vector2(),
	height: z.number().min(0.001, 'min height 0.001'),
	direction: z.direction()
});
