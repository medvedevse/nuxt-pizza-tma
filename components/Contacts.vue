<script setup lang="ts">
import { useWebAppCloudStorage } from 'vue-tg';
import type { IContactData, IContactsProps } from '~/types/types';

const { updateContactData } = useTgWebAppStore();
const { isDisabled } = storeToRefs(useTgWebAppStore());

const props = defineProps<IContactsProps>();

const savedAddress = ref<string | null>(
	await useWebAppCloudStorage().getStorageItem('address')
);

const data = ref<IContactData>({
	...props.contactData,
	address: savedAddress.value ? savedAddress.value : '',
});

const validateFields = () => {
	!data.value.address ||
	!data.value.first_name ||
	!data.value.last_name ||
	!data.value.phone_number
		? (isDisabled.value = true)
		: (isDisabled.value = false);
	watch(isDisabled, newVal => console.log(newVal), { immediate: true });
};

const saveAddress = () =>
	useWebAppCloudStorage().setStorageItem('address', data.value.address || '');
</script>

<template>
	<form class="max-w-md mx-auto">
		<div class="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6">
			<div class="relative z-0 w-full mb-5 group">
				<input
					@input="
						updateContactData(data as IContactData, 'first_name');
						validateFields();
					"
					v-model="data.first_name"
					type="text"
					name="first_name"
					id="first_name"
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
					required
				/>
				<label
					for="first_name"
					class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Имя</label
				>
			</div>
			<div class="relative z-0 w-full mb-5 group">
				<input
					@input="
						updateContactData(data as IContactData, 'last_name');
						validateFields();
					"
					v-model="data.last_name"
					type="text"
					name="last_name"
					id="last_name"
					class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
					placeholder=" "
					required
				/>
				<label
					for="last_name"
					class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
					>Фамилия</label
				>
			</div>
		</div>
		<div class="relative z-0 w-full mb-5 group">
			<input
				@input="
					updateContactData(data as IContactData, 'phone_number');
					validateFields();
				"
				v-model="data.phone_number"
				type="tel"
				name="phone"
				id="phone"
				class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
				placeholder=" "
				required
			/>
			<label
				for="phone"
				class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
				>Номер телефона</label
			>
		</div>
		<div class="relative z-0 w-full mb-5 group">
			<input
				@input="
					updateContactData(data as IContactData, 'address');
					validateFields();
					saveAddress();
				"
				v-model="data.address"
				type="tel"
				name="address"
				id="address"
				class="block py-2.5 px-0 w-full text-sm text-gray-900 bg-transparent border-0 border-b-2 border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
				placeholder=" "
				required
			/>
			<label
				for="address"
				class="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:start-0 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
			>
				Адрес</label
			>
		</div>
	</form>
</template>
