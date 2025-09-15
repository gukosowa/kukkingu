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
        style="backdrop-filter: blur(1px)"
        @click="close"
      >
        <div class="w-full min-h-full px-12 py-8 flex flex-col transform">
          <div class="bg-white p-5 rounded-xl drop-shadow max-w-md mx-auto" @click.stop>
            <div class="text-lg text-gray-600 font-bold mb-4">{{ t('Ask GPT') }}</div>

            <!-- Predefined Questions -->
            <div class="mb-4">
              <div class="text-sm text-gray-500 mb-2">{{ t('Quick questions') }}:</div>
              <div class="space-y-2">
                <button
                  @click="addQuestion(t('gpt_add_tags'))"
                  class="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                >
                  <div class="font-medium text-blue-800">{{ t('Add Tags') }}</div>
                  <div class="text-sm text-blue-600">{{ t('Add tags to this recipe') }}</div>
                </button>

                <button
                  @click="addQuestion(t('gpt_add_procedure'))"
                  class="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
                >
                  <div class="font-medium text-green-800">{{ t('Add Cooking Procedure') }}</div>
                  <div class="text-sm text-green-600">{{ t('Add cooking procedure to this recipe') }}</div>
                </button>

                <button
                  @click="addQuestion(t('gpt_find_similar'))"
                  class="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                >
                  <div class="font-medium text-purple-800">{{ t('Find Similar Recipes') }}</div>
                  <div class="text-sm text-purple-600">{{ t('List me 10 URLs of similar recipes or cooking sites') }}</div>
                </button>
              </div>
            </div>

            <!-- Custom Question -->
            <div class="mb-4">
              <div class="text-sm text-gray-500 mb-2">{{ t('Or ask your own question') }}:</div>
              <textarea
                v-model="localValue"
                :placeholder="t('Type your question here...')"
                ref="textareaRef"
                class="w-full border focus:ring-indigo-500 text-black p-3 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md min-h-[80px] resize-none"
                rows="3"
              />
            </div>

            <div class="text-white text-center space-y-2">
              <div
                class="cursor-pointer py-3 bg-green-500 rounded-lg drop-shadow hover:bg-green-600 transition-colors"
                @click="confirm"
              >
                {{ t('Ask GPT') }}
              </div>
              <div
                class="cursor-pointer py-2 bg-gray-500 rounded-lg drop-shadow hover:bg-gray-600 transition-colors"
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
import { ref, watch, nextTick } from 'vue'
import { t } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title?: string
    placeholder?: string
    confirmText?: string
    cancelText?: string
    value?: string
  }>(),
  {
    title: t('Ask GPT'),
    placeholder: t('Type your question here...'),
    confirmText: t('Ask GPT'),
    cancelText: t('Cancel'),
    value: '',
  }
)

const emit = defineEmits<{
  (e: 'confirm', v: string): void
  (e: 'cancel'): void
  (e: 'update:modelValue', v: boolean): void
}>()

const localValue = ref(props.value)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function addQuestion(question: string) {
  if (localValue.value.trim()) {
    localValue.value += '\n\n' + question
  } else {
    localValue.value = question
  }

  // Focus the textarea after adding the question
  nextTick(() => {
    textareaRef.value?.focus()
    // Move cursor to the end
    if (textareaRef.value) {
      textareaRef.value.selectionStart = textareaRef.value.value.length
      textareaRef.value.selectionEnd = textareaRef.value.value.length
    }
  })
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      localValue.value = props.value
      nextTick(() => {
        textareaRef.value?.focus()
      })
    }
  }
)

function confirm() {
  vibrate()
  emit('confirm', localValue.value)
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
