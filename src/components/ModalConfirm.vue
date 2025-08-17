<template>
  <div v-if="modelValue">
    <div class="fixed w-screen h-screen bg-black top-0 left-0 z-40 opacity-50" />
    <div
      class="fixed w-screen w-full h-screen top-0 left-0 z-50"
      style="backdrop-filter: blur(1px)"
      @click="clickNo"
    >
      <div class="w-full h-full px-12 pb-8 flex flex-col justify-end">
        <div class="w- bg-white p-5 rounded-xl drop-shadow">
          <div class="text-lg text-gray-600 font-bold">
            {{ t('Really delete') }}?<br />
            <span class="text-sm">> {{ removeName }}</span>
          </div>
          <div class="text-white text-center">
            <div
              class="cursor-pointer py-3 my-5 bg-red-500 rounded-lg drop-shadow"
              @click.stop="clickYes"
            >
              {{ t('Yes') }}
            </div>
            <div
              class="cursor-pointer py-3 bg-gray-500 rounded-lg drop-shadow"
              @click.stop="clickNo"
            >
              {{ t('Cancel') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { t } from '~src/i18n'

defineProps<{ modelValue: boolean; removeName?: string }>()
const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void; (e: 'update:modelValue', v: boolean): void }>()

function clickYes() {
  emit('confirm')
}
function clickNo() {
  emit('cancel')
}
</script>

<style scoped>
  .drop-shadow {
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))
      drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
  }
</style>

