<script lang="ts" setup>
const { BiometricManager } = await import('vue-tg');

const {
	isBiometricSuccess,
	isAccessBiometricGranted,
	isBiometricSupported,
	isBiometricInited,
} = storeToRefs(useTgWebAppStore());
const { authBiometric } = useTgWebAppStore();
</script>

<template>
	<BiometricManager @init="authBiometric">
		<template
			#loading
			v-if="!isBiometricInited"
		>
			<div class="mb-2 text-gray-900 dark:text-gray-100">Biometric init...</div>
		</template>

		<template
			v-if="isBiometricInited && !isBiometricSupported"
			#not-supported
		>
			<div class="mb-2 text-gray-900 dark:text-gray-100">
				Biometric is not supported on the current device
			</div>
		</template>

		<template
			v-if="isBiometricInited && !isAccessBiometricGranted"
			#not-granted
		>
			<div class="mb-2 text-gray-900 dark:text-gray-100">
				Biometric access is not granted
			</div>
		</template>

		<div class="mb-2 text-gray-900 dark:text-gray-100">
			Biometric is ready to use
		</div>
	</BiometricManager>
</template>
