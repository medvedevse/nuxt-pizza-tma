export default defineEventHandler(async () => {
	const { baseApiUrl } = useRuntimeConfig();

	const data = await $fetch(`${baseApiUrl}/data`);
	return data;
});
