import { NAME } from './index';
import type { FunctionComponent as FC } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { $isGKIISelected, $selected_file, $selected_structure, god_global_event } from './state';
import { useStore } from '@nanostores/preact';
import { StructurePreview } from './gui/StructurePreview';
import { kii } from '@/keyboard';


let text_code = '';

export const GUI: FC = () => {
	useEffect(() => void (document.title = NAME), []);

	const isGKIISelected = useStore($isGKIISelected);
	const file = useStore($selected_file);
	const selected_structure = useStore($selected_structure);

	const input = useRef<HTMLTextAreaElement>(null);

	return <>
		<div gui-layer theme-custom class='GUI' style={{
			alignSelf: 'start',
			padding: '5px',
			height: 'max-content'
		}}>
			<button onClick={() => {
				isGKIISelected ? kii.blur() : kii.focus();
			}}>KII { isGKIISelected ? 'off' : 'on' }</button>

			<button onClick={async () => {
				if(file) {
					text_code = input.current!.value;
					god_global_event(text_code);
					$selected_file.set(null);
					return;
				}

				const data = text_code || await fetch(`${location.origin}/user/unit.js`).then(data => data.text());

				kii.blur();
				$selected_file.set({ name: 'unit', path: 'user/unit.js', data });
			}}>{file ? 'compile' : 'open'}</button>

			{ selected_structure && <StructurePreview structure={selected_structure} /> }

			<div gui-layer hidden={ !file } style={{ width: '90vw', height: 'calc(var(--vh))' }}>
				<p style={{ fontFamily: 'monospace' }}>{file?.name} ({file?.path})</p>

				<textarea ref={input} style={{
					padding: '5px 10px',
					width: '100%',
					height: '100%',
					color: '#aaaaee',
					background: '#222222',
					fontFamily: 'monospace',
					opacity: 0.8
				}}>{file?.data}</textarea>
			</div>
		</div>
	</>
}
