import crypto from 'crypto';
import { NuxtError } from 'nuxt/app';

export interface IOrderItem {
	name: string;
	count: number;
	price: number;
}

export default defineEventHandler(async event => {
	const body = await readBody(event);

	const unsafeData = new URLSearchParams(body.unsafeData);
	const hash = unsafeData.get('hash');

	const contact = body && body.contactData;
	const order = body && body.order;

	const dataToCheck: string[] = [];

	const { telegramBotToken } = useRuntimeConfig();

	unsafeData.sort();
	unsafeData.forEach(
		(val, key) => key !== 'hash' && dataToCheck.push(`${key}=${val}`)
	);

	const secret = crypto
		.createHmac('sha256', 'WebAppData')
		.update(telegramBotToken)
		.digest();

	const _hash = crypto
		.createHmac('sha256', secret)
		.update(dataToCheck.join('\n'))
		.digest('hex');

	if (hash !== _hash) {
		throw createError({
			statusCode: 400,
			statusMessage: 'Неверные данные',
		});
	}

	let message = `<b>${
		contact.first_name.trim() + ' ' + contact.last_name.trim()
	}</b>, спасибо за заказ! Мы уже начали его приготовление.\n\n`;
	message += `Привезем по адресу: <b>${contact.address ?? null}</b>\n`;
	message +=
		'<i>Отсканируйте QR код курьера через приложение Telegram для проведения оплаты и получения бонусов!</i>\n\n';
	message += 'Мой заказ: \n';

	order.forEach((item: IOrderItem) => {
		message += `<b>${item.name}</b> - ${item.count} шт. по ${item.price} ₽ \n`;
	});

	message += `Итого: <b>${body.total}</b> ₽ \n`;

	try {
		$fetch(`https://api.telegram.org/bot${telegramBotToken}/test/sendMessage`, {
			method: 'POST',
			body: {
				parse_mode: 'html',
				chat_id: contact.user_id,
				text: message,
			},
		});
	} catch (e) {
		console.error((e as NuxtError).message);
	}

	return true;
});
