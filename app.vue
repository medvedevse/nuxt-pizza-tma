<script setup lang="ts">
onMounted(async () => {
	const VueTg = await import('vue-tg');
	await useTgWebAppStore().init();
});
</script>
<template>
	<NuxtPage />
</template>
