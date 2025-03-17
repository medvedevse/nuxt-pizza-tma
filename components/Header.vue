<script setup lang="ts">
import type { IHeaderProps } from '~/types/types';

defineProps<IHeaderProps>();
</script>
<template>
	<div class="flex justify-between items-center mb-4">
		<span class="text-black dark:text-white">
			{{ contactData.first_name }} {{ contactData.last_name }}
			{{ contactData.phone_number }}
		</span>
		<div class="flex gap-2">
			<button @click="$emit('use-qr')">
				<img
					src="https://cdn1.iconfinder.com/data/icons/buno-ecommerce-shopping-2/32/qrcode_qr_code_reader_scan-64.png"
					alt=""
					width="30"
				/>
			</button>
			<button @click="$emit('toggle-dark-mode')">
				{{ darkMode ? '🌝' : '🌚' }}
			</button>
		</div>
	</div>
</template>
