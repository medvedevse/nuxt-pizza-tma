import type { NuxtError } from '#app';
import type {
	BiometricManager,
	CloudStorage,
	IContactData,
	IOrderItem,
	IPizza,
	IWebData,
	Popup,
	Requests,
	FullScreen,
	WebApp,
	IBiometricResponse,
} from '~/types/types';

export const useTgWebAppStore = defineStore('tgWebAppStore', () => {
	let webApp: WebApp;
	let cloudStorage: CloudStorage;
	let popup: Popup;
	let requests: Requests;
	let biometricManager: BiometricManager;
	let getFullScreen: FullScreen;

	const DADATA_TOKEN = import.meta.env.VITE_APP_DADATA_API_KEY;

	const webAppData = ref<IWebData | null>(null);
	const dataUnsafe = ref<string | null>(null);
	const contactData = ref<IContactData>({
		first_name: '',
		last_name: '',
		phone_number: '',
		user_id: '',
		unsafe: '',
	});

	const darkMode = ref<boolean>(false);
	const showOrder = ref<boolean>(false);
	const order = ref<IOrderItem[]>([]);
	const orderStep = ref<number>(0);
	const orderNumber = ref<number>(0);
	const isDisabled = ref<boolean>(true);

	const isBiometricSuccess = ref<boolean>(false);
	const isAccessBiometricGranted = ref<boolean>(false);
	const isBiometricSupported = ref<boolean>(false);
	const isBiometricInited = ref<boolean>(false);

	const ssrHelper = async () => {
		if (import.meta.client) {
			const {
				useWebApp,
				useWebAppCloudStorage,
				useWebAppPopup,
				useWebAppRequests,
				useWebAppBiometricManager,
				useWebAppHapticFeedback,
			} = await import('vue-tg');
			webApp = useWebApp;
			cloudStorage = useWebAppCloudStorage;
			popup = useWebAppPopup;
			requests = useWebAppRequests;
			biometricManager = useWebAppBiometricManager;
			getFullScreen = useWebAppHapticFeedback;
		}
	};

	const initDataUnsafe = async () => {
		const data = await cloudStorage().getStorageItem('initDataUnsafe');
		if (typeof data === 'string' && data === '') {
			dataUnsafe.value = await webApp().initDataUnsafe;
			await cloudStorage().setStorageItem(
				'initDataUnsafe',
				JSON.stringify(dataUnsafe.value)
			);
		} else {
			dataUnsafe.value = data && JSON.parse(data);
		}
		return dataUnsafe.value;
	};

	const initContactData = async () => {
		const data = await cloudStorage().getStorageItem('contactData');
		if (typeof data === 'string' && data === '') {
			await requests().requestContact(async (ok, response) => {
				alert('initContactData: ' + ok);
				if (ok) {
					contactData.value = {
						first_name:
							(
								response.responseUnsafe.contact.first_name as string
							)[0].toUpperCase() +
							(response.responseUnsafe.contact.first_name as string).slice(1),
						last_name:
							(response.responseUnsafe.contact.last_name &&
								(
									response.responseUnsafe.contact.last_name as string
								)[0].toUpperCase()) ||
							'',
						phone_number:
							(response.responseUnsafe.contact.phone_number as string).slice(
								1,
								5
							) + '****',
						user_id: response.responseUnsafe.contact.user_id as string,
						unsafe: response.response as string,
					};

					await cloudStorage().setStorageItem(
						'contactData',
						JSON.stringify(contactData.value)
					);
				} else {
					await popup().showAlert('Контакт не получен');
				}
			});
		} else {
			contactData.value = data && JSON.parse(data);
		}
		return contactData.value;
	};

	const init = async () => {
		await ssrHelper();
		webAppData.value = await webApp();
		console.log('webAppData', webAppData.value);
		if (webAppData.value && webAppData.value.version > '6.0') {
			dataUnsafe.value = await initDataUnsafe();
			contactData.value = await initContactData();
			return true;
		}
		console.error(new Error('webAppData is undefined'));
	};

	const authBiometric = async () => {
		if (webAppData.value && webAppData.value.version > '7.2') {
			try {
				// Правильно инициализируем биометрию
				const res = await biometricManager().initBiometric();
				isBiometricInited.value = res.isInited;

				// Проверяем, доступна ли биометрия
				isBiometricSupported.value = await biometricManager()
					.isBiometricAvailable.value;
				if (!isBiometricSupported.value) {
					alert('Биометрия недоступна на устройстве');
					isBiometricSuccess.value = true;
					return { ok: true, message: 'Биометрия недоступна на устройстве' };
				}

				// Запрашиваем доступ к биометрии, если он еще не предоставлен
				isAccessBiometricGranted.value = await biometricManager()
					.isBiometricAccessGranted.value;
				if (!isAccessBiometricGranted.value) {
					const accessResult = await biometricManager().requestBiometricAccess({
						allowFaceID: true,
						allowTouchID: true,
					});

					if (!accessResult.granted) {
						alert('Доступ к биометрии не предоставлен');
						isBiometricSuccess.value = false;
						return { ok: false, message: 'Доступ к биометрии не предоставлен' };
					}
				}

				// Аутентификация с биометрией
				const result = await biometricManager().authenticateBiometric({
					reason: 'Подтвердите ваш заказ',
				});

				// Если токен отсутствует или требуется обновление
				if (!result.token || !biometricManager().isBiometricTokenSaved.value) {
					const newToken = Math.random().toString(36).substring(2, 15);
					await biometricManager().updateBiometricToken(newToken);
					alert('Биометрия пройдена, токен обновлен');
					isBiometricSuccess.value = true;
					return {
						ok: true,
						token: newToken,
						deviceId: await biometricManager().biometricDeviceId.value,
						message: 'Биометрия пройдена, токен обновлен',
					};
				}
				alert('Биометрия пройдена');
				isBiometricSuccess.value = true;
				return {
					ok: true,
					token: result.token,
					deviceId: await biometricManager().biometricDeviceId.value,
					message: 'Биометрия пройдена',
				};
			} catch (error) {
				alert('Ошибка биометрии: ' + (error as NuxtError).message);
				isBiometricSuccess.value = false;
				console.error('Ошибка биометрии:', (error as NuxtError).message);
				return {
					ok: false,
					message: `Ошибка биометрии: ${(error as NuxtError).message}`,
				};
			}
		}

		// Если версия не поддерживает биометрию, просто пропускаем этот шаг
		alert('Биометрия не поддерживается в данной версии');
		isBiometricSuccess.value = true;
		return { ok: true, message: 'Биометрия не поддерживается в данной версии' };
	};

	const orderProcess = async (step: number) => {
		step++;
		await getFullScreen().impactOccurred('heavy');
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
				break;
			case 4:
				if (
					webAppData.value && webAppData.value.version > '7.2'
						? isBiometricSuccess.value
						: (isBiometricSuccess.value = true)
				) {
					orderStep.value++;
					const savedOrderNumber = await cloudStorage().getStorageItem(
						'orderNumber'
					);
					if (savedOrderNumber) {
						orderNumber.value = Number(savedOrderNumber);
					}
					orderNumber.value++;
					await cloudStorage().setStorageItem(
						'orderNumber',
						String(orderNumber.value)
					);
					await $fetch('/api/order', {
						method: 'POST',
						body: {
							order: order.value,
							total: total.value,
							contactData: contactData.value,
							unsafeData: contactData.value && contactData.value.unsafe,
							address: contactData.value.address,
						},
					});
				} else return null;
				webAppData.value && (await webAppData.value.close());
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
		DADATA_TOKEN,
		authBiometric,
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
		isBiometricSuccess,
		isAccessBiometricGranted,
		isBiometricSupported,
		isBiometricInited,
		enableScroll,
	};
});
