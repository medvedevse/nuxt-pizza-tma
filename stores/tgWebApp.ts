import {
	useWebApp,
	useWebAppCloudStorage,
	useWebAppPopup,
	useWebAppRequests,
	useWebAppBiometricManager,
} from 'vue-tg';

export interface IContactData {
	first_name: string;
	last_name: string;
	phone_number: string;
	user_id: string;
	unsafe: string;
}

export interface IWebData {
	initData: string;
	initDataUnsafe: string;
	version: string;
	platform: string;
}

export const useTgWebAppStore = defineStore('tgWebAppStore', () => {
	const webAppData = ref<IWebData | null>(null);
	const dataUnsafe = ref<string | null>(null);
	const contactData = ref<IContactData | null>(null);

	const init = () => {
		return new Promise(async (resolve, reject) => {
			webAppData.value = useWebApp();

			if (webAppData.value.version > '6.0') {
				dataUnsafe.value = (await initDataUnsafe()) as string;
				contactData.value = (await initContactData()) as IContactData;
			}

			resolve(true);
		});
	};

	const initDataUnsafe = () => {
		return new Promise(async (resolve, reject) => {
			let dataUnsafe: string | null = null;

			useWebAppCloudStorage()
				.getStorageItem('initDataUnsafe')
				.then(data => {
					if (typeof data === 'string' && data === '') {
						dataUnsafe = useWebApp().initDataUnsafe;
						useWebAppCloudStorage().setStorageItem(
							'initDataUnsafe',
							JSON.stringify(dataUnsafe)
						);
					} else {
						dataUnsafe = data && JSON.parse(data);
					}
					resolve(dataUnsafe);
				});
		});
	};

	const initContactData = () => {
		return new Promise(async (resolve, reject) => {
			let contactData: IContactData | null = null;

			useWebAppCloudStorage()
				.getStorageItem('contactData')
				.then(data => {
					if (typeof data === 'string' && data === '') {
						useWebAppRequests().requestContact((ok, response) => {
							if (ok) {
								contactData = {
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
									JSON.stringify(contactData)
								);
							} else {
								useWebAppPopup().showAlert('Контакт не получен');
							}
						});
					} else {
						contactData = data && JSON.parse(data);
					}
					resolve(contactData);
				});
		});
	};

	const authenticateBiometric = () => {
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
	return {
		authenticateBiometric,
		contactData,
		dataUnsafe,
		init,
		initContactData,
		initDataUnsafe,
	};
});
