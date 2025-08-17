<template>
  <div v-if="modelValue">
    <div class="fixed w-screen h-screen bg-black top-0 left-0 z-40 opacity-50" />
    <div
      class="fixed w-screen w-full h-screen top-0 left-0 z-50"
      style="backdrop-filter: blur(1px)"
      @click="close"
    >
      <div class="w-full h-full px-12 pb-8 flex flex-col justify-end">
        <div class="bg-white p-5 rounded-xl drop-shadow" @click.stop>
          <div class="text-lg text-gray-600 font-bold">{{ title }}</div>
          <div class="my-5">
            <SInput
              v-if="!multiline"
              v-model="localValue"
              :placeholder="placeholder"
              :autofocus="true"
            />
            <textarea
              v-else
              v-model="localValue"
              :placeholder="placeholder"
              autofocus
              class="w-full focus:ring-indigo-500 text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md"
            />
          </div>
          <div class="text-white text-center">
            <div
              class="cursor-pointer py-3 my-2 bg-green-500 rounded-lg drop-shadow"
              @click="confirm"
            >
              {{ confirmText }}
            </div>
            <div
              class="cursor-pointer py-3 bg-gray-500 rounded-lg drop-shadow"
              @click="close"
            >
              {{ cancelText }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import SInput from './Input.vue'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    placeholder?: string
    confirmText?: string
    cancelText?: string
    value?: string
    multiline?: boolean
  }>(),
  {
    placeholder: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    value: '',
    multiline: false,
  }
)
const emit = defineEmits<{
  (e: 'confirm', v: string): void
  (e: 'cancel'): void
  (e: 'update:modelValue', v: boolean): void
}>()

const localValue = ref(props.value)
watch(
  () => props.modelValue,
  (v) => {
    if (v) localValue.value = props.value
  }
)

function confirm() {
  emit('confirm', localValue.value)
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

