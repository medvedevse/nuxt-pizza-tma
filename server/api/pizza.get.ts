export default defineEventHandler(async () => {
	const data = await $fetch('https://pizza-tma-json-server.vercel.app/data');
	return data;
});
