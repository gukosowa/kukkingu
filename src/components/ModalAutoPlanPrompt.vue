<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
      <!-- Header - Fixed at top -->
      <div class="flex-shrink-0 border-b border-gray-200">
        <h2 class="text-lg font-semibold px-4 py-3">{{ t('Auto Plan Prompt Maker') }}</h2>
        <p class="text-sm text-gray-500 mt-0.5 px-4">{{ t('Customize your prompt before sending to GPT') }}</p>
      </div>

      <!-- Content - Scrollable -->
      <div class="flex-1 overflow-y-auto p-6">
        <div class="space-y-6">
          <!-- Prompt Preview -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('Generated Prompt') }}</label>
            <p class="text-xs text-gray-500 mb-2">{{ t('This prompt will be sent to GPT with your preferences and all recipe data') }}</p>
            <textarea
              v-model="editablePrompt"
              class="w-full border border-gray-300 rounded-lg p-4 text-sm font-mono bg-gray-50 min-h-[400px] resize-vertical"
              :placeholder="t('Prompt will appear here...')"
            />
          </div>

          <!-- Plan Details Summary -->
          <div class="bg-gray-50 rounded-lg p-4">
            <h3 class="font-medium text-gray-900 mb-2">{{ t('Plan Details') }}</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-gray-500">{{ t('Days') }}:</span>
                <span class="ml-2 font-medium">{{ options.length || 7 }}</span>
              </div>
              <div>
                <span class="text-gray-500">{{ t('Recipes Available') }}:</span>
                <span class="ml-2 font-medium">{{ recipeCount }}</span>
              </div>
              <div>
                <span class="text-gray-500">{{ t('Preferred Tags') }}:</span>
                <span class="ml-2 font-medium">{{ options.preferences?.length || 0 }}</span>
              </div>
              <div>
                <span class="text-gray-500">{{ t('Excluded Tags') }}:</span>
                <span class="ml-2 font-medium">{{ options.exclusions?.length || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer - Fixed at bottom -->
      <div class="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
        <Button
          @click="sendToChatGPT"
          class="flex-1 bg-green-600 hover:bg-green-700 text-white"
          :disabled="!editablePrompt.trim()"
        >
          <Icon icon="fal fa-paper-plane" size="0.9rem" class="mr-2" />
          {{ t('Send to ChatGPT') }}
        </Button>
        <Button
          @click="copyPrompt"
          class="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          :disabled="!editablePrompt.trim()"
        >
          <Icon icon="fal fa-copy" size="0.9rem" class="mr-2" />
          {{ t('Copy Prompt') }}
        </Button>
        <Button
          @click="close"
          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
        >
          {{ t('Cancel') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { t } from '~src/i18n'
import { generateAutoMealPlanPrompt } from '~src/services/planner'
import { openChatGPT } from '~src/services/chatgpt'
import { recipes } from '~src/store/index'
import Icon from './Icon.vue'
import Button from './Button.vue'

interface AutoPlanOptions {
  length?: number
  preferences?: string[]
  exclusions?: string[]
  dietaryRestrictions?: string[]
  cuisineTypes?: string[]
  maxRecipesPerDay?: number
  includeSnacks?: boolean
}

const props = defineProps<{
  modelValue: boolean
  options: AutoPlanOptions
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const editablePrompt = ref('')

// Count available recipes
const recipeCount = computed(() => {
  return recipes.value.filter(recipe => recipe.id && recipe.ingredients.length > 0).length
})

// Generate prompt when modal opens or options change
watch([() => props.modelValue, () => props.options], () => {
  if (props.modelValue) {
    try {
      editablePrompt.value = generateAutoMealPlanPrompt(props.options)
    } catch (error) {
      console.error('Failed to generate prompt:', error)
      editablePrompt.value = t('Error generating prompt. Please check that you have recipes available.')
    }
  }
}, { immediate: true, deep: true })

async function sendToChatGPT() {
  if (!editablePrompt.value.trim()) return

  try {
    await openChatGPT(editablePrompt.value)
    close()
  } catch (error) {
    console.error('Failed to open ChatGPT:', error)
  }
}

async function copyPrompt() {
  if (!editablePrompt.value.trim()) return

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(editablePrompt.value)
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = editablePrompt.value
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    // Could add a toast notification here
  } catch (error) {
    console.error('Failed to copy prompt:', error)
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>
