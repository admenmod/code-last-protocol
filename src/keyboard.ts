import { KeyboardInputInterceptor } from 'ver/KeyboardInputInterceptor';
import { KeymapperOfActions } from 'ver/KeymapperOfActions';

const input = document.createElement('input');
input.style.position = 'fixed';
input.style.left = '-10000px';
document.querySelector<HTMLDivElement>('#GUI')!.append(input);

export const kii = new KeyboardInputInterceptor({ preventDefault: true }).init(input);
export const ka = new KeymapperOfActions('main').init(kii);
export const ka_main = ka.getMode('main');
