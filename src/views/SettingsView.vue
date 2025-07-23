<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { RouterLink } from 'vue-router';

useHead({ title: 'Settings' });

// HACK: is_fullscreen
let is_fullscreen = false;

const buttonStyle = {
	padding: '5px 15px',
	minWidth: '20vw',
	fontSize: '15px',
	fontFamily: 'arkhip, monospace'
} satisfies Partial<CSSStyleDeclaration>;
</script>

<template>
	<div theme-custom class='GUI' :style="{
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
	}">
		<RouterLink :style="buttonStyle" to="/menu" />
	</div>

	<div v-show="!is_fullscreen" theme-custom class='GUI' :style="{
		paddingBottom: '5px',
		opacity: 0.5,
		fontSize: '0.7rem',
		fontFamily: 'arkhip, monospace',

		alignSelf: 'end',
		gridArea: '1/1/1/1'
	}">Двойной клик - полноэкранный режим</div>
</template>

<style scoped>
/* code... */
</style>
