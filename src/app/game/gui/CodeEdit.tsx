export function CodeEdit({ data, name, path, input }: {
	data: string, name: string, path: string,
	input: ReturnType<typeof useRef<HTMLTextAreaElement | null>> 
}) {
	return <div gui-layer hidden={!data} style={{ width: '90vw', height: 'calc(var(--vh))' }}>
		<p style={{ fontFamily: 'monospace' }}>{name} ({path})</p>

		<textarea ref={input} style={{
			padding: '5px 10px',
			width: '100%',
			height: '100%',
			color: '#aaaaee',
			background: '#222222',
			fontFamily: 'monospace',
			opacity: 0.8
		}}>{data}</textarea>
	</div>
}
