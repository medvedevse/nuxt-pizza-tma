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
	UseQR,
	Theme,
} from '~/types/types';

export const useTgWebAppStore = defineStore('tgWebAppStore', () => {
	let webApp: WebApp;
	let cloudStorage: CloudStorage;
	let popup: Popup;
	let requests: Requests;
	let biometricManager: BiometricManager;
	let getFullScreen: FullScreen;
	let useQr: UseQR;
	let useTheme: Theme;

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
	const qrFlag = ref<boolean>(false);
	const theme = ref<'light' | 'dark'>();

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
				useWebAppQrScanner,
				useWebAppTheme,
			} = await import('vue-tg');
			webApp = useWebApp;
			cloudStorage = useWebAppCloudStorage;
			popup = useWebAppPopup;
			requests = useWebAppRequests;
			biometricManager = useWebAppBiometricManager;
			getFullScreen = useWebAppHapticFeedback;
			useQr = useWebAppQrScanner;
			useTheme = useWebAppTheme;
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
		theme.value = useTheme().colorScheme.value;
		webAppData.value = await webApp();
		console.log('webAppData', webAppData.value);

		if (webAppData.value && webAppData.value.version > '6.0') {
			dataUnsafe.value = await initDataUnsafe();
			contactData.value = await initContactData();
			return true;
		}
		console.error(new Error('webAppData is undefined'));
	};

	const biometricHandler = async () => {
		const isTokenSaved = biometricManager().isBiometricTokenSaved.value;

		// Если токен отсутствует или требуется обновление
		if (!isTokenSaved) {
			const newToken = Math.random().toString(36).substring(2, 15);
			await biometricManager().updateBiometricToken(newToken);
			popup().showAlert('Биометрия пройдена, токен обновлен');
			isBiometricSuccess.value = true;
			return {
				ok: true,
				token: newToken,
				deviceId: biometricManager().biometricDeviceId.value,
				message: 'Биометрия пройдена, токен обновлен',
			};
		}
		popup().showAlert('Биометрия пройдена');
		isBiometricSuccess.value = true;
		return {
			ok: true,
			deviceId: biometricManager().biometricDeviceId.value,
			message: 'Биометрия пройдена',
		};
	};

	/*@deprecated*/
	const onBioAuth = () =>
		biometricManager().onBiometricAuthRequested(biometricHandler, {
			manual: false,
		});

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
					popup().showAlert('Биометрия недоступна на устройстве');
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
						popup().showAlert('Доступ к биометрии не предоставлен');
						isBiometricSuccess.value = false;
						return { ok: false, message: 'Доступ к биометрии не предоставлен' };
					}
				}

				onBioAuth();

				// Аутентификация с биометрией
				const result = await biometricManager().authenticateBiometric({
					reason: 'Подтвердите ваш заказ',
				});

				const isTokenSaved = biometricManager().isBiometricTokenSaved.value;

				// Если токен отсутствует или требуется обновление
				if (!isTokenSaved || !result.token) {
					const newToken = Math.random().toString(36).substring(2, 15);
					await biometricManager().updateBiometricToken(newToken);
					isBiometricSuccess.value = true;
					return {
						ok: true,
						token: newToken,
						deviceId: biometricManager().biometricDeviceId.value,
						message: 'Биометрия пройдена, токен обновлен',
					};
				}
				isBiometricSuccess.value = true;
				return {
					ok: true,
					deviceId: biometricManager().biometricDeviceId.value,
					message: 'Биометрия пройдена',
					token: result.token,
				};
			} catch (error) {
				popup().showAlert('Ошибка биометрии: ' + (error as NuxtError).message);
				isBiometricSuccess.value = false;
				console.error('Ошибка биометрии:', (error as NuxtError).message);
				return {
					ok: false,
					message: `Ошибка биометрии: ${(error as NuxtError).message}`,
				};
			}
		}

		// Если версия не поддерживает биометрию, просто пропускаем этот шаг
		popup().showAlert('Биометрия не поддерживается в данной версии');
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
					webAppData.value &&
					(webAppData.value.platform.toLowerCase() === 'android' ||
						webAppData.value.platform.toLowerCase() === 'ios')
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

	const updateContactData = computed(
		() => (data: IContactData, key: keyof IContactData) => {
			contactData.value[key] = data[key] as string;
			return;
		}
	);

	const handleUseQr = () => {
		qrFlag.value = true;
		setTimeout(() => (qrFlag.value = false), 5000);
	};

	const onDecode = (data: string) => {
		if (data) {
			useQr().closeScanQrPopup();

			if (data.startsWith('http')) {
				window.location.href = data;
			} else {
				popup().showAlert(`Отсканирован QR-код: ${data}`);
			}
		}
	};

	const validateFields = (data: IContactData) => {
		const addressRule =
			data.address && /^[а-яА-ЯёË.,\/\w\s-]+$/g.test(data.address);
		const firstNameRule = /^[а-яА-ЯёËa-zA-Z]+$/g.test(data.first_name);
		const lastNameRule = /^[а-яА-ЯёËa-zA-Z]+$/g.test(data.last_name);
		const phoneRule = /^[\d*]+$/g.test(data.phone_number);

		!data.address ||
		!addressRule ||
		!(data.address.length && data.address.length > 10) ||
		!data.first_name ||
		!firstNameRule ||
		!data.last_name ||
		!lastNameRule ||
		!data.phone_number ||
		!phoneRule
			? (isDisabled.value = true)
			: (isDisabled.value = false);
		return !isDisabled.value;
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
		handleUseQr,
		onDecode,
		qrFlag,
		theme,
		onBioAuth,
		validateFields,
	};
});
