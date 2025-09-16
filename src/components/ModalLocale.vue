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
        class="fixed w-screen h-screen top-0 left-0 z-50 overflow-y-auto"
        style="backdrop-filter: blur(2px)"
        @click="close"
      >
        <div class="w-full min-h-full px-6 py-8 flex flex-col">
          <div class="bg-white p-6 rounded-2xl shadow-lg" @click.stop>
            <div class="text-xl text-gray-700 font-bold mb-4">{{ t('Language') }}</div>

            <div class="grid gap-3 my-4">
              <div
                v-for="opt in locales"
                :key="opt.value"
                @click="localLocale = opt.value"
                class="cursor-pointer flex items-center justify-between border rounded-xl p-3 transition-all duration-200"
                :class="localLocale === opt.value
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'"
              >
                <span class="text-lg">{{ opt.label }}</span>
                <div
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  :class="localLocale === opt.value
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-400'"
                >
                  <div v-if="localLocale === opt.value" class="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
            </div>

            <div class="flex gap-3 mt-6">
              <button
                class="flex-1 py-3 bg-gray-500 text-white rounded-xl shadow-md font-semibold hover:bg-gray-600 transition-colors"
                @click="close"
              >
                {{ t('Cancel') }}
              </button>
              <button
                class="flex-1 py-3 bg-green-500 text-white rounded-xl shadow-md font-semibold hover:bg-green-600 transition-colors"
                @click="confirm"
              >
                {{ t('OK') }}
              </button>
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
import { vibrate } from '~src/services/vibrate'

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
  vibrate()
  emit('confirm', localLocale.value)
}
function close() {
  vibrate()
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
