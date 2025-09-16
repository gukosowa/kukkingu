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
        class="fixed w-screen w-full h-screen top-0 left-0 z-50 overflow-y-auto"
        style="backdrop-filter: blur(1px)"
        @click="clickNo"
      >
        <div class="w-full min-h-full px-6 sm:px-12 py-8 flex flex-col transform">
          <div class="w- bg-white rounded-xl drop-shadow flex flex-col overflow-hidden">
            <!-- Header -->
            <div class="px-4 py-3 border-b border-gray-200">
              <div class="text-lg text-gray-600 font-bold">
                {{ t('Really delete') }}?
              </div>
            </div>

            <!-- Content -->
            <div class="p-5">
              <div class="text-sm text-gray-500">
                > {{ removeName }}
              </div>
            </div>

            <!-- Footer -->
            <div class="py-3 px-3 border-t border-gray-200 bg-gray-50">
              <div class="flex gap-4">
                <div
                  class="cursor-pointer py-2 px-4 bg-gray-500 text-white rounded-lg drop-shadow flex-1"
                  @click.stop="clickNo"
                >
                  {{ t('Cancel') }}
                </div>
                <div
                  class="cursor-pointer py-2 px-4 bg-red-500 text-white rounded-lg drop-shadow flex-1"
                  @click.stop="clickYes"
                >
                  {{ t('Yes') }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'

defineProps<{ modelValue: boolean; removeName?: string }>()
const emit = defineEmits<{ (e: 'confirm'): void; (e: 'cancel'): void; (e: 'update:modelValue', v: boolean): void }>()

function clickYes() {
  vibrate()
  emit('confirm')
}
function clickNo() {
  vibrate()
  emit('cancel')
}
</script>

<style scoped>
  .drop-shadow {
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))
      drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
  }
</style>
