<template>
  <div v-if="modelValue">
    <div class="fixed w-screen h-screen bg-black top-0 left-0 z-40 opacity-50" />
    <Transition
      appear
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 translate-y-3"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="modelValue"
        class="fixed w-screen w-full h-screen top-0 left-0 z-50"
        style="backdrop-filter: blur(1px)"
        @click="close"
      >
        <div class="w-full h-full px-12 pb-8 flex flex-col justify-end transform">
          <div class="bg-white p-5 rounded-xl drop-shadow" @click.stop>
            <div class="text-lg text-gray-600 font-bold">{{ t('Language') }}</div>
            <div class="my-5 text-black">
              <label v-for="opt in locales" :key="opt.value" class="flex items-center mb-2">
                <input
                  type="radio"
                  class="mr-2"
                  :value="opt.value"
                  v-model="localLocale"
                />
                <span>{{ opt.label }}</span>
              </label>
            </div>
            <div class="text-white text-center">
              <div
                class="cursor-pointer py-3 my-2 bg-green-500 rounded-lg drop-shadow"
                @click="confirm"
              >
                {{ t('OK') }}
              </div>
              <div
                class="cursor-pointer py-3 bg-gray-500 rounded-lg drop-shadow"
                @click="close"
              >
                {{ t('Cancel') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { t } from '~src/i18n'

const props = defineProps<{ modelValue: boolean; locale: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', v: string): void
  (e: 'cancel'): void
}>()

const locales = [
  { value: 'jp', label: 'JP' },
  { value: 'en', label: 'EN' },
  { value: 'de', label: 'DE' },
]

const localLocale = ref(props.locale)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      localLocale.value = props.locale
    }
  }
)

function confirm() {
  emit('confirm', localLocale.value)
}
function close() {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
  .drop-shadow {
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))
      drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
  }
</style>
