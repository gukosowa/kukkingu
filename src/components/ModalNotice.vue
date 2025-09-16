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
        @click="close"
      >
        <div class="w-full min-h-full px-6 sm:px-12 py-8 flex flex-col transform">
          <div class="bg-white p-5 rounded-xl drop-shadow" @click.stop>
            <div class="flex items-start">
              <Icon v-if="icon" :icon="icon" class="text-blue-500 mr-3 mt-1" size="1.5rem" />
              <div class="flex-1">
                <div class="text-lg text-gray-700 font-bold">{{ title }}</div>
                <div class="text-sm text-gray-700 mt-2 whitespace-pre-line">{{ message }}</div>
                <slot />
              </div>
            </div>
            <div class="text-white text-center mt-6">
              <div
                class="cursor-pointer py-3 bg-blue-600 rounded-lg drop-shadow"
                @click="acknowledge"
              >
                {{ okText }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script lang="ts" setup>
import Icon from './Icon.vue'
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    message: string
    icon?: string
    okText?: string
  }>(),
  {
    icon: 'fal fa-info-circle',
    okText: t('OK'),
  }
)
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'ok'): void
}>()

function acknowledge() {
  vibrate()
  emit('ok')
  emit('update:modelValue', false)
}
function close() {
  vibrate()
  emit('update:modelValue', false)
}
</script>

<style scoped>
.drop-shadow {
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
}
</style>

