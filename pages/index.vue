<script setup lang="ts">
import { MainButton, ClosingConfirmation } from 'vue-tg';
import { pizzas } from '~/data/mock';

const {
	toggleDarkMode,
	openOrderModal,
	updateOrder,
	closeModal,
	updateContactData,
	orderProcess,
} = useTgWebAppStore();
const {
	contactData,
	darkMode,
	order,
	showOrder,
	orderStep,
	total,
	mainButtonText,
	isDisabled,
} = storeToRefs(useTgWebAppStore());
</script>
<template>
	<div :class="darkMode ? 'dark' : ''">
		<div class="p-4 bg-tg-background dark:bg-gray-600 min-h-screen">
			<Header
				:darkMode="darkMode"
				@toggle-dark-mode="toggleDarkMode"
				@open-modal="openOrderModal"
			/>

			<div
				class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
			>
				<PizzaCard
					v-for="pizza in pizzas"
					:key="pizza.id"
					:image="pizza.image"
					:name="pizza.name"
					:price="pizza.price"
					@update-order="updateOrder"
					:order="order"
				/>
			</div>

			<Modal
				:show="showOrder"
				:title="orderStep === 3 ? `Заказ оформлен!` : `Заказ`"
				@close="closeModal"
			>
				<Order
					v-if="orderStep === 1"
					:order="order"
					:total="total"
				/>
				<Contacts
					v-if="orderStep === 2"
					:contactData="contactData"
				/>
				<ThankYou v-if="orderStep === 3" />
			</Modal>
		</div>
		<MainButton
			:text="mainButtonText"
			@click="orderProcess(orderStep)"
			:visible="order.length > 0 && orderStep !== 3"
			:color="darkMode ? `#5f9ea0` : `#008b8b`"
			:disabled="orderStep === 2 && isDisabled"
		/>
		<ClosingConfirmation />
	</div>
</template>
