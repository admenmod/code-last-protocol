import { Entity } from '@/game/Entity';


export function EntityPreview<T extends Entity>({ entity }: { entity: T }) {
	return <div gui-layer theme-custom class='GUI' style={{
		display: 'grid',
		alignSelf: 'center',
		justifySelf: 'center',
		margin: 'auto',
		padding: '5px 10px',
		width: '90vw',
		height: '90%',
		background: 'rgba(30, 30, 30, 0.7)'
	}}>
		{ entity.modules.map(it => it.id) }
	</div>
}
