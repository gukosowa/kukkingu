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
        <div class="w-full min-h-full px-12 py-8 flex flex-col transform">
          <div class="bg-white p-5 rounded-xl drop-shadow" @click.stop>
            <div class="text-lg text-gray-600 font-bold">{{ title }}</div>
            <div class="my-5 space-y-4">
              <div>
                <div class="text-sm text-gray-600 mb-1">{{ t('Recipe URL') }}</div>
                <SInput
                  v-model="localUrl"
                  :placeholder="placeholderUrl"
                  :autofocus="true"
                  ref="inputRef"
                />
              </div>
              <div>
                <div class="text-sm text-gray-600 mb-1">{{ t('Recipe text') }}</div>
                <textarea
                  v-model="localText"
                  :placeholder="placeholderText"
                  ref="textareaRef"
                  rows="1"
                  class="w-full focus:ring-indigo-500 border text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md overflow-hidden resize-none"
                  @input="autoResize"
                />
              </div>
              <div class="flex items-center">
                <Checkbox class="mr-2" v-model="localFromPicture" />
                <label
                  class="text-sm text-gray-600 cursor-pointer"
                  @click="localFromPicture = !localFromPicture"
                >
                  {{ t('From pictures') }}
                </label>
              </div>
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
    </Transition>
  </div>

</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue'
import SInput from './Input.vue'
import Checkbox from './Checkbox.vue'
import { t } from '~src/i18n'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    placeholderUrl?: string
    placeholderText?: string
    confirmText?: string
    cancelText?: string
    url?: string
    text?: string
    fromPicture?: boolean
  }>(),
  {
    placeholderUrl: t('https://example.com'),
    placeholderText: '',
    confirmText: t('OK'),
    cancelText: t('Cancel'),
    url: '',
    text: '',
    fromPicture: false,
  }
)
const emit = defineEmits<{
  (e: 'confirm', v: { url: string; text: string; fromPicture: boolean }): void
  (e: 'cancel'): void
  (e: 'update:modelValue', v: boolean): void
}>()

const localUrl = ref(props.url)
const localText = ref(props.text)
const localFromPicture = ref(props.fromPicture)
const inputRef = ref<InstanceType<typeof SInput> | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      localUrl.value = props.url || ''
      localText.value = props.text || ''
      localFromPicture.value = props.fromPicture || false
      nextTick(() => {
        inputRef.value?.focus?.()
        autoResize()
      })
    }
  }
)

function confirm() {
  emit('confirm', {
    url: (localUrl.value || '').trim(),
    text: (localText.value || '').trim(),
    fromPicture: localFromPicture.value,
  })
}
function close() {
  emit('cancel')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.drop-shadow {
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
}
</style>
