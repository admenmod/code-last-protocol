import type { FunctionComponent as FC } from 'preact';
import { useStore } from '@nanostores/preact';
import { $is_fullscreen, $start } from '@/state';


const buttonStyle = {
	padding: '5px 15px',
	minWidth: '20vw',
	fontSize: '15px',
	fontFamily: 'arkhip, monospace'
} satisfies Partial<CSSStyleDeclaration>;


export const GUI: FC = () => {
	const is_fullscreen = useStore($is_fullscreen);

	return <>
		<div theme-custom class='GUI' style={{
			zIndex: 1,
			display: 'grid',
			gap: '10px',
			alignContent: 'center',
			justifyContent: 'center',
			gridTemplate: 'repeat(4, max-content) / repeat(2, max-content)',
			gridAutoFlow: 'column dense',
			padding: '20px',
			width: '100vw',
			height: '100dvh',
			overflow: 'hidden',

			alignSelf: 'center',
			justifySelf: 'center',
			gridArea: '1/1/1/1'
		}}>
			<button style={buttonStyle} onClick={() => $start('menu')}>Меню</button>
		</div>

		{ !is_fullscreen ? <div theme-custom class='GUI' style={{
			paddingBottom: '5px',
			opacity: 0.5,
			fontSize: '0.7rem',
			fontFamily: 'arkhip, monospace',

			alignSelf: 'end',
			gridArea: '1/1/1/1'
		}}>Двойной клик - полноэкранный режим</div> : '' }
	</>
}
