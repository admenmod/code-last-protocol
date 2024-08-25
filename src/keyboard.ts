import { KeyboardInputInterceptor } from 'ver/KeyboardInputInterceptor';

const input = document.createElement('input');
input.style.position = 'fixed';
input.style.left = '-10000px';
document.querySelector<HTMLDivElement>('#GUI')!.append(input);

export const kii = new KeyboardInputInterceptor({ preventDefault: true }).init(input);
