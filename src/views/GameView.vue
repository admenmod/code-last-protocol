<script setup lang="ts">
import { useHead } from '@unhead/vue';
import { init } from '@/scene';

useHead({ title: 'Game' });

init();

// const vh = (x: number) => `calc(var(--vh) * ${x})`;
</script>

<template>
	<div gui-layer theme-custom class='GUI' :style="{
		alignSelf: 'start',
		padding: '5px',
		height: 'max-content'
	}"></div>
</template>

<style scoped>
/* code... */
</style>
