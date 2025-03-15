<script setup lang="ts">
onMounted(async () => {
	await useTgWebAppStore().init();
});
</script>
<template>
	<NuxtLayout>
		<NuxtPage />
	</NuxtLayout>
</template>
