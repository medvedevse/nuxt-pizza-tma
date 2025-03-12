<script setup lang="ts">
import { MainButton } from 'vue-tg';
import { ClosingConfirmation } from 'vue-tg';
import { pizzas } from '~/data/mock';
import type { IContactData, IOrderItem, IPizza } from '~/types/types';

const darkMode = ref<boolean>(true);
const showOrder = ref<boolean>(false);
const order = ref<IOrderItem[]>([]);
const orderStep = ref<number>(0);

const { contactData, webAppData, authenticateBiometric } = useTgWebAppStore();

const orderProcess = async (step: number) => {
	step++;
	switch (step) {
		case 1:
			openOrderModal();
			orderStep.value++;
			break;
		case 2:
			orderStep.value++;
			break;
		case 3:
			const res = (await authenticateBiometric()) as Response;
			if (res.ok) {
				await $fetch('/api/order', {
					method: 'POST',
					body: {
						order: order.value,
						total: total.value,
						contactData: contactData,
						unsafeData: contactData && contactData.unsafe,
					},
				});

				webAppData && webAppData.close();
			}

		default:
			break;
	}
};

const updateContactData = (data: IContactData) => {
	console.log(data);
};

const toggleDarkMode = () => {
	darkMode.value = !darkMode.value;
};

const openOrderModal = () => {
	showOrder.value = true;
	disableScroll();
};

const orderNow = async () => {
	alert('Заказ оформлен');
};

const closeModal = () => {
	showOrder.value = false;
	orderStep.value = 0;
	enableScroll();
};

const total = computed(() => {
	return order.value.reduce(
		(total, pizza) => total + pizza.price * pizza.count,
		0
	);
});
const updateOrder = (pizza: IPizza) => {
	const existingPizza = order.value.find(p => p.name === pizza.name);
	if (pizza.action === 'add') {
		if (existingPizza) {
			existingPizza.count++;
		} else {
			order.value.push({ ...pizza, count: 1 });
		}
	} else if (pizza.action === 'remove') {
		if (existingPizza && existingPizza.count > 1) {
			existingPizza.count--;
		} else {
			order.value = order.value.filter(p => p.name !== pizza.name);
		}
	}
};

const disableScroll = () => {
	document.body.classList.add('overflow-hidden');
};

const enableScroll = () => {
	document.body.classList.remove('overflow-hidden');
};

const mainButtonText = computed(() => {
	if (order.value.length > 0 && !showOrder.value) {
		return 'Заказать';
	} else {
		return 'Оформить';
	}
});
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
					v-for="(pizza, index) in pizzas"
					:key="index"
					:image="pizza.image"
					:name="pizza.name"
					:price="pizza.price"
					@update-order="updateOrder"
					:order="order"
				/>
			</div>

			<Modal
				:show="showOrder"
				title="Заказ"
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
					@updateContactData="updateContactData"
				/>
			</Modal>
		</div>
		<MainButton
			:text="mainButtonText"
			@click="orderProcess(orderStep)"
			:visible="order.length > 0"
			:color="darkMode ? `#5f9ea0` : `#008b8b`"
		/>
		<ClosingConfirmation />
	</div>
</template>
