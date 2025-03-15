declare module 'vue-dadata' {
	import { DefineComponent } from 'vue';

	interface IVueDadata {
		token: string;
		placeholder?: string;
		query?: string;
	}

	export const VueDadata: DefineComponent<IVueDadata>;
}
