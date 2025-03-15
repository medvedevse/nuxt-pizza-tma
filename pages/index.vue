<script setup lang="ts">
import { pizzas } from '~/data/mock';

const { MainButton, ClosingConfirmation, useWebAppTheme, useWebApp } =
	await import('vue-tg');

const {
	toggleDarkMode,
	openOrderModal,
	updateOrder,
	closeModal,
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
	isBiometricSuccess,
} = storeToRefs(useTgWebAppStore());

const theme = useWebAppTheme().colorScheme;
darkMode.value = theme.value === 'dark' ? true : false;
</script>
<template>
	<div :class="darkMode ? 'dark' : ''">
		<div class="p-4 bg-tg-background dark:bg-gray-600 min-h-screen">
			<Header
				:darkMode="darkMode"
				@toggle-dark-mode="toggleDarkMode"
				@open-modal="openOrderModal"
				:contactData="contactData"
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
					:order="order"
					@update-order="updateOrder"
				/>
			</div>

			<Modal
				:show="showOrder"
				:title="orderStep === 3 ? `Оформление` : `Заказ`"
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
					:isDisabled="isDisabled"
				/>
				<AuthBanner v-if="orderStep === 3" />
				<ThankYou v-if="isBiometricSuccess && orderStep === 4" />
			</Modal>
		</div>
		<MainButton
			:text="mainButtonText"
			@click="orderProcess(orderStep)"
			:visible="order.length > 0 && orderStep !== 4"
			:color="darkMode ? `#5f9ea0` : `#008b8b`"
			textColor="#f0ffff"
			:disabled="orderStep === 2 && isDisabled"
		/>
		<BiometricManager v-if="!isBiometricSuccess && orderStep === 3" />
		<ClosingConfirmation />
	</div>
</template>
