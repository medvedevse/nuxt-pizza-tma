<script setup lang="ts">
const { orderNumber } = storeToRefs(useTgWebAppStore());
</script>

<template>
	<div class="mb-2 text-gray-900 dark:text-gray-100">
		Собираем заказ №{{ orderNumber }}
	</div>
</template>
