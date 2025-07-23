<script setup lang="ts">
import { useHead } from '@unhead/vue';

useHead({ title: 'Menu' });
</script>

<template>
	<nav>
		<RouterLink v-for="route in $router.options.routes" :to="route.path">{{ route.name }}</RouterLink>
	</nav>
</template>

<style scoped>
/* code... */
</style>
