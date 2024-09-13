import { NAME } from './index';
import type { FunctionComponent as FC } from 'preact';
import { useEffect } from 'preact/hooks';
import { $isGKIISelected, $selected_file, $selected_structure } from './state';
import { useStore } from '@nanostores/preact';
import { StructurePreview } from './gui/StructurePreview';
import { CodeEditor } from './gui/CodeEditor';
import { kii } from '@/keyboard';


export const GUI: FC = () => {
	useEffect(() => void (document.title = NAME), []);

	const isGKIISelected = useStore($isGKIISelected);
	const selected_file = useStore($selected_file);
	const selected_structure = useStore($selected_structure);

	let content;

	if(selected_file) {
		content = <CodeEditor key={selected_file.path} file={selected_file} />;
	} else if(selected_structure) {
		content = <StructurePreview structure={selected_structure} />;
	}

	return <>
		<div theme-custom class='GUI' style={{
			gridArea: '1/1/1/1',
			alignSelf: 'start',
			display: 'grid',
			padding: '5px',
			gridTemplateColumns: `repeat(${2}, max-content)`,
			gap: '10px',
			height: 'max-content'
		}}>
			<button onClick={() => {
				isGKIISelected ? kii.blur() : kii.focus();
			}}>KII { isGKIISelected ? 'off' : 'on' }</button>

			<button onClick={async () => {
				if(selected_file) return;
				kii.blur();
				const code = await fetch(`${location.origin}/user/unit.js`).then(data => data.text());
				$selected_file.set({ name: 'unit', path: 'user/unit.js', data: code });
			}}>open</button>
		</div>
	</>
}
		//
		// <div theme-custom class='GUI' style={{
		// 	gridArea: '1/2/2/1',
		// 	alignSelf: 'start',
		// 	width: '100%',
		// 	height: '100%',
		// 	background: '#00000080'
		// }}>{content}</div>
