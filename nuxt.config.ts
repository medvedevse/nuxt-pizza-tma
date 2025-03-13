// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: false },
	ssr: false,

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
		telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
	},

	// devServer: {
	//     host: '127.0.0.1',
	// },

	compatibilityDate: '2024-08-08',
	modules: ['@pinia/nuxt'],

	vite: {
		server: {
			allowedHosts: ['.ngrok-free.app'], // разрешает все поддомены ngrok
		},
	},
});
