<template>
  <BaseDialog v-model:modelValue="show" :title="t('Ask GPT about Recipes')" @backdrop="close">
    <div class="space-y-4">
      <div class="text-sm text-gray-600">
        {{ infoMessage }}
      </div>

      <div
        v-if="filterActive"
        class="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800"
      >
        <div class="font-medium">{{ t('Filter applied') }}</div>
        <div class="mt-1">
          {{ filteredCount }} / {{ totalCount }} {{ t('recipes') }}
        </div>
        <div
          v-if="filterQueryDisplay"
          class="mt-1 text-xs text-yellow-700"
        >
          {{ t('Filter query') }}: "{{ filterQueryDisplay }}"
        </div>
        <div
          v-if="!hasFilteredResults"
          class="mt-2 text-xs text-yellow-700"
        >
          {{ t('No recipes match the current filter. The prompt will be empty.') }}
        </div>
      </div>

      <textarea
        ref="questionTextarea"
        v-model="question"
        class="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        :placeholder="t('Ask a question about your recipes...')"
      />

      <div class="space-y-2">
        <div class="text-sm font-medium">{{ t('Example questions:') }}</div>
        <div class="space-y-1 text-sm text-gray-600">
          <div class="cursor-pointer hover:text-blue-600" @click="addQuestion(t('What are my most common ingredients?'))">
            • {{ t('What are my most common ingredients?') }}
          </div>
          <div class="cursor-pointer hover:text-blue-600" @click="addQuestion(t('Show me recipes that take less than 20 minutes.'))">
            • {{ t('Show me recipes that take less than 20 minutes.') }}
          </div>
          <div class="cursor-pointer hover:text-blue-600" @click="addQuestion(t('What can I cook with the ingredients I have in my fridge?'))">
            • {{ t('What can I cook with the ingredients I have in my fridge?') }}
          </div>
          <div class="cursor-pointer hover:text-blue-600" @click="addQuestion(t('Show me recipes with fewer than 5 ingredients.'))">
            • {{ t('Show me recipes with fewer than 5 ingredients.') }}
          </div>
          <div class="cursor-pointer hover:text-blue-600" @click="addQuestion(t('What\'s a good weekend breakfast idea?'))">
            • {{ t('What\'s a good weekend breakfast idea?') }}
          </div>
          <div class="cursor-pointer hover:text-blue-600" @click="addQuestion(t('Show me quick snacks I can make after work.'))">
            • {{ t('Show me quick snacks I can make after work.') }}
          </div>
          <div class="cursor-pointer hover:text-blue-600" @click="addQuestion(t('Show me recipes with seasonal ingredients right now.'))">
            • {{ t('Show me recipes with seasonal ingredients right now.') }}
          </div>
          <div class="cursor-pointer hover:text-blue-600" @click="addQuestion(t('Suggest meal ideas for next week'))">
            • {{ t('Suggest meal ideas for next week') }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="px-3 py-2 flex gap-3">
        <button
          class="cursor-pointer py-3 px-4 bg-gray-500 text-white rounded-lg drop-shadow flex-1 hover:bg-gray-600 transition-colors"
          @click="close"
        >
          {{ t('Cancel') }}
        </button>
        <button
          :class="[
            'cursor-pointer py-3 px-4 rounded-lg drop-shadow flex-1 transition-colors',
            question.trim()
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          ]"
          :disabled="!question.trim()"
          @click="confirm"
        >
          <Icon icon="fal fa-magic" class="mr-2" size="1rem" />
          {{ t('Ask GPT') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue'
import BaseDialog from './BaseDialog.vue'
import Icon from './Icon.vue'
import { t } from '~src/i18n'
import { recipes as allRecipes } from '~src/store/index'
import { buildAskGptStoragePrompt } from '~src/services/prompt'
import { legacyCopyToClipboard } from '~src/services/chatgpt'
import { currentLocale } from '~src/i18n'

interface Props {
  modelValue: boolean
  recipes?: any[]
  filterQuery?: string | null
  isFilterActive?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', question: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const trimmedFilterQuery = computed(() => (props.filterQuery || '').trim())
const filterActive = computed(() =>
  props.isFilterActive !== undefined
    ? !!props.isFilterActive
    : trimmedFilterQuery.value.length > 0
)
const filterQueryDisplay = computed(() => trimmedFilterQuery.value)
const resolvedRecipes = computed(() => (props.recipes ? props.recipes : allRecipes.value))
const totalCount = computed(() => allRecipes.value.length)
const filteredCount = computed(() => resolvedRecipes.value.length)
const hasFilteredResults = computed(() => filteredCount.value > 0)
const infoMessage = computed(() =>
  filterActive.value
    ? t('Ask questions about your recipes. Only filtered recipes will be included in the prompt.')
    : t('Ask questions about your recipes. All recipes will be included in the prompt.')
)

const question = ref('')
const questionTextarea = ref<HTMLTextAreaElement | null>(null)

function addQuestion(questionText: string) {
  question.value = questionText
  nextTick(() => {
    questionTextarea.value?.focus()
  })
}

async function confirm() {
  if (!question.value.trim()) return

  const locale = currentLocale.value === 'jp'
    ? 'Japanese'
    : currentLocale.value === 'de'
    ? 'German'
    : 'English'

  const prompt = buildAskGptStoragePrompt(resolvedRecipes.value, question.value.trim(), locale as any)

  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(prompt)
    } else {
      legacyCopyToClipboard(prompt)
    }
  } catch (_) {
    legacyCopyToClipboard(prompt)
  }

  emit('confirm', question.value.trim())
  show.value = false
  question.value = ''
}

function close() {
  show.value = false
  question.value = ''
}
</script>
