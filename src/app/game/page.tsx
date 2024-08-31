import type { FunctionComponent as FC } from 'preact';
import { useEffect } from 'preact/hooks';
import { $selected_structure, NAME } from './index.js';
import { useStore } from '@nanostores/preact';
import { StructurePreview } from './gui/StructurePreview.js';


export const GUI: FC = () => {
	useEffect(() => void (document.title = NAME), []);

	const selected_structure = useStore($selected_structure);

	return <>
		{ selected_structure ? <StructurePreview structure={selected_structure} /> : '' }
	</>
}
