// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2024-08-08',
	devtools: { enabled: false },
	ssr: true,

	app: {
		head: {
			meta: [
				{
					name: 'viewport',
					content:
						'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no',
				},
			],
			script: [
				{
					src: 'https://telegram.org/js/telegram-web-app.js',
					defer: true,
				},
			],
		},
	},

	css: ['~/assets/css/main.css'],

	postcss: {
		plugins: {
			tailwindcss: {},
			autoprefixer: {},
		},
	},

	runtimeConfig: {
		telegramBotToken: import.meta.env.VITE_TELEGRAM_BOT_TOKEN,
		baseApiUrl: import.meta.env.VITE_API_BASE_URL,
	},

	modules: ['@pinia/nuxt'],

	vite: {
		server: {
			allowedHosts: ['.ngrok-free.app'], // разрешает все поддомены ngrok
		},
	},
});
