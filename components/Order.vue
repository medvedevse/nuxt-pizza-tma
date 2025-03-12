<script setup lang="ts">
import type { IOrderProps } from '~/types/types';

defineProps<IOrderProps>();
</script>

<template>
	<div class="flex flex-col h-full justify-between">
		<div>
			<ul>
				<li
					v-for="(pizza, index) in order"
					:key="pizza.id"
					class="mb-2 text-gray-900 dark:text-gray-100"
				>
					{{ pizza.name }} - {{ pizza.price }} ₽ ({{ pizza.count }})
				</li>
			</ul>
		</div>
		<div class="text-gray-900 dark:text-gray-100 text-xl font-bold">
			<div class="mb-2">Итого: {{ total }} ₽</div>
		</div>
	</div>
</template>
