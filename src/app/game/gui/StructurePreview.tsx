import type { Structure } from '@/world/structure';


export function StructurePreview<T extends Structure>({ structure }: { structure: T }) {
	return <div theme-custom class='GUI' style={{
		display: 'grid',
		alignSelf: 'center',
		justifySelf: 'center',
		margin: 'auto',
		padding: '5px 10px',
		width: '90vw',
		height: '90%',
		background: 'rgba(30, 30, 30, 0.7)'
	}}>
		<p style={{ justifySelf: 'center' }}>{structure.title}</p>
	</div>
}
