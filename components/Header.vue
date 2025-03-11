<script setup lang="ts">
defineProps({
	darkMode: Boolean,
});

const data = useTgWebAppStore().dataUnsafe;
// console.log(data);

const contactData = useTgWebAppStore().contactData;
</script>
<template>
	<div class="flex justify-between items-center mb-4">
		<span class="text-black dark:text-white">
			{{ contactData?.first_name }} {{ contactData?.last_name }}
			{{ contactData?.phone_number }}
		</span>
		<button @click="$emit('toggle-dark-mode')">
			{{ darkMode ? '🌝' : '🌚' }}
		</button>
	</div>
</template>
