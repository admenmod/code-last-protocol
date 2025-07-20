import { Default, object } from 'ver/helpers';
import { st } from 'ver/super-type';
import { GST } from '@/st-types';


export namespace mod_st { 'off tree-shaking :)'; }
export namespace mod_env { 'off tree-shaking :)'; }
export namespace modules { 'off tree-shaking :)'; }

export type AnyModule = InstanceType<AnyModuleConstructor>;
export type AnyModuleConstructor = typeof modules[keyof typeof modules];
export type AnyModuleId = keyof typeof mod_st;
export type ModuleById<T extends AnyModuleId[]> = typeof modules[T[number]];


export type DefaultModulesParams = {};
export type DefaultEntityParams = st.infer<typeof GST.entity> & DefaultModulesParams;

export type ModulesParams<T extends AnyModuleId[]> = Default<object.assign<{ [K in keyof T]: st.infer<typeof mod_st[T[K]]>; }>, {}>;
export type EntityParams<T extends AnyModuleId[]> = DefaultEntityParams & ModulesParams<T>;

export type AnyModulesParams = ModulesParams<AnyModuleId[]>;
export type AnyEntityParams = EntityParams<AnyModuleId[]>;
