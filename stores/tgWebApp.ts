import {
	useWebApp,
	useWebAppCloudStorage,
	useWebAppPopup,
	useWebAppRequests,
	useWebAppBiometricManager,
} from 'vue-tg';
import type { IContactData, IOrderItem, IPizza, IWebData } from '~/types/types';

export const useTgWebAppStore = defineStore('tgWebAppStore', () => {
	const webAppData = ref<IWebData | null>(null);
	const dataUnsafe = ref<string | null>(null);
	const contactData = ref<IContactData>({
		first_name: '',
		last_name: '',
		phone_number: '',
		user_id: '',
		unsafe: '',
	});

	const darkMode = ref<boolean>(true);
	const showOrder = ref<boolean>(false);
	const order = ref<IOrderItem[]>([]);
	const orderStep = ref<number>(0);
	const orderNumber = ref<number>(0);
	const isDisabled = ref<boolean>(true);

	const init = () => {
		return new Promise(async (resolve, reject) => {
			webAppData.value = useWebApp();

			if (webAppData.value && webAppData.value.version > '6.0') {
				dataUnsafe.value = (await initDataUnsafe()) as string;
				contactData.value = (await initContactData()) as IContactData;
			}

			resolve(true);
		});
	};

	const initDataUnsafe = () => {
		return new Promise(async (resolve, reject) => {
			useWebAppCloudStorage()
				.getStorageItem('initDataUnsafe')
				.then(data => {
					if (typeof data === 'string' && data === '') {
						dataUnsafe.value = useWebApp().initDataUnsafe;
						useWebAppCloudStorage().setStorageItem(
							'initDataUnsafe',
							JSON.stringify(dataUnsafe.value)
						);
					} else {
						dataUnsafe.value = data && JSON.parse(data);
					}
					resolve(dataUnsafe.value);
				});
		});
	};

	const initContactData = () => {
		return new Promise(async (resolve, reject) => {
			useWebAppCloudStorage()
				.getStorageItem('contactData')
				.then(data => {
					if (typeof data === 'string' && data === '') {
						useWebAppRequests().requestContact((ok, response) => {
							if (ok) {
								contactData.value = {
									first_name: response.responseUnsafe.contact.first_name,
									last_name: response.responseUnsafe.contact.last_name,
									phone_number:
										response.responseUnsafe.contact.phone_number.slice(1, 5) +
										'****',
									user_id: response.responseUnsafe.contact.user_id,
									unsafe: response.response,
								};
								useWebAppCloudStorage().setStorageItem(
									'contactData',
									JSON.stringify(contactData.value)
								);
							} else {
								useWebAppPopup().showAlert('Контакт не получен');
							}
						});
					} else {
						contactData.value = data && JSON.parse(data);
					}
					resolve(contactData.value);
				});
		});
	};

	const authenticateBiometric = async () => {
		return new Promise((resolve, reject) => {
			if (
				webAppData.value != null &&
				webAppData.value.platform !== 'tdesktop' &&
				webAppData.value.version > '7.2'
			) {
				useWebAppBiometricManager().initBiometric(() => {
					const biometricSettings =
						useWebAppBiometricManager().openBiometricSettings();
					if (biometricSettings.isBiometricAvailable) {
						useWebAppBiometricManager().authenticateBiometric(
							'Это нужно, чтобы подтвердить Ваш заказ',
							(ok: string, token: string) => {
								if (ok) {
									if (!token.length) {
										token = Math.random().toString(36).substring(2, 15);

										useWebAppBiometricManager().updateBiometricToken(
											token,
											() => {
												resolve({
													ok: true,
													token: token,
													deviceId: biometricSettings.deviceId,
													message: 'Мы верифицировали Ваш заказ',
												});
											}
										);
									} else {
										resolve({
											ok: true,
											token,
											deviceId: biometricSettings.deviceId,
											message: 'Мы верифицировали Ваш заказ',
										});
									}
								} else {
									resolve({
										token,
										ok: false,
										message: 'Мы не смогли верифицировать Ваш заказ',
									});
								}
							}
						);
					} else {
						resolve({
							ok: false,
							message: 'Мы не смогли верифицировать Ваш заказ',
						});
					}
				});
			} else {
				resolve({
					ok: true,
				});
			}
		});
	};

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
				orderStep.value++;
				orderNumber.value++;
				const res = (await authenticateBiometric()) as Response;
				if (res.ok) {
					await useFetch('/api/order', {
						method: 'POST',
						body: {
							order: order.value,
							total: total.value,
							contactData: contactData.value,
							unsafeData: contactData.value && contactData.value.unsafe,
						},
					});

					webAppData.value && webAppData.value.close();
					orderNow();
				}
				break;
			default:
				break;
		}
	};

	const toggleDarkMode = () => {
		darkMode.value = !darkMode.value;
	};

	const openOrderModal = () => {
		showOrder.value = true;
		disableScroll();
	};

	const orderNow = () => {
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

	const mainButtonText = computed(() =>
		order.value.length > 0 && !showOrder.value ? 'Заказать' : 'Оформить'
	);

	const updateContactData = (data: IContactData, key: keyof IContactData) => {
		contactData.value[key] = data[key] as string;
	};
	return {
		authenticateBiometric,
		contactData,
		dataUnsafe,
		init,
		initContactData,
		initDataUnsafe,
		webAppData,
		darkMode,
		toggleDarkMode,
		openOrderModal,
		updateOrder,
		order,
		showOrder,
		orderStep,
		closeModal,
		total,
		updateContactData,
		mainButtonText,
		orderProcess,
		orderNumber,
		isDisabled,
	};
});
