<template>
  <BaseDialog v-model="showModal" size="sm" @close="close">
    <template #header>
      <div class="px-4 py-3">
        <div class="text-lg text-gray-700 font-bold">{{ t('Language') }}</div>
      </div>
    </template>

    <template #content>
      <div class="grid gap-3">
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
    </template>

    <template #footer>
      <div class="px-4 py-3 flex gap-3">
        <button
          class="cursor-pointer py-3 flex-1 bg-gray-500 text-white rounded-lg drop-shadow hover:bg-gray-600 transition-colors"
          @click="close"
        >
          {{ t('Cancel') }}
        </button>
        <button
          class="cursor-pointer py-3 flex-1 bg-green-500 text-white rounded-lg drop-shadow hover:bg-green-600 transition-colors"
          @click="confirm"
        >
          {{ t('OK') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'
import BaseDialog from './BaseDialog.vue'

const props = defineProps<{ modelValue: boolean; locale: string }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'confirm', v: string): void
  (e: 'cancel'): void
}>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

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
  showModal.value = false
}
function close() {
  vibrate()
  emit('cancel')
  showModal.value = false
}
</script>

