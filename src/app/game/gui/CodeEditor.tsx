import type { FunctionComponent as FC } from 'preact';
import { type IEditFile } from '../state';
import { kii } from '@/keyboard';


export const CodeEditor: FC<{ file: IEditFile }> = ({ file }) => {
	return <div style={{ width: '100%', height: '100%' }}>
		<p style={{ fontFamily: 'monospace' }}>{file} ({file.path})</p>

		<textarea style={{
			padding: '5px 10px',
			width: '100%',
			height: '100%',
			color: '#aaaaee',
			background: '#222222',
			fontFamily: 'monospace',
			opacity: 0.8
		}}>{file.data}</textarea>
	</div>
};
