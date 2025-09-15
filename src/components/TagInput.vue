<template>
  <div class="w-full">
    <label class="text-sm font-medium text-gray-700 mb-2 block">{{ t('Tags') }}</label>

    <!-- Display existing tags -->
    <div v-if="modelValue && modelValue.length > 0" class="flex flex-wrap gap-2 mb-3">
      <span
        v-for="(tag, index) in modelValue"
        :key="tag"
        class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 border-blue-200 border text-blue-800"
      >
        {{ tag }}
        <button
          @click="removeTag(index)"
          class="ml-2 inline-flex items-center -mr-2 px-2.5 py-2 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
          type="button"
        >
          <Icon icon="fal fa-times" size="0.7rem" />
        </button>
      </span>
    </div>

    <!-- Input and suggestions -->
    <div class="relative">
      <div class="flex gap-2">
        <input
          ref="inputRef"
          v-model="inputValue"
          :placeholder="t('Add tag...')"
          @input="handleInput"
          @keydown="handleKeydown"
          @focus="handleFocus"
          @blur="handleBlur"
          class="flex-1 border focus:ring-indigo-500 text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md"
          type="text"
        />
        <Button
          @click="addTagFromInput"
          :disabled="!inputValue.trim()"
          color="green"
          class="whitespace-nowrap"
        >
          {{ t('Add') }}
        </Button>
      </div>

      <!-- Suggestions dropdown -->
      <div
        v-if="showSuggestions && filteredSuggestions.length > 0"
        ref="dropdownRef"
        :class="[
          'absolute bg-white border border-gray-300 rounded-md shadow-2xl max-h-60 overflow-y-auto',
          dropdownPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-1'
        ]"
        style="z-index: 9999; left: 0; right: 0; margin-left: -1px; margin-right: -1px;"
      >
        <div
          v-for="(suggestion, index) in filteredSuggestions"
          :key="suggestion"
          @mousedown.prevent
          @click="addTag(suggestion)"
          class="px-4 py-3 hover:bg-gray-100 cursor-pointer text-sm"
          :class="{ 'bg-blue-50': index === highlightedIndex }"
        >
          {{ suggestion }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue'
import Icon from './Icon.vue'
import Button from './Button.vue'
import { getAllTags } from '~src/store/index'
import { t } from '~src/i18n'

const props = withDefaults(
  defineProps<{
    modelValue?: string[]
  }>(),
  { modelValue: () => [] }
)

const emit = defineEmits<{
  (e: 'update:modelValue', v: string[]): void
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)
const inputValue = ref('')
const showSuggestions = ref(false)
const highlightedIndex = ref(-1)
const dropdownPosition = ref<'top' | 'bottom'>('bottom')

const allTags = computed(() => getAllTags())

const filteredSuggestions = computed(() => {
  if (!inputValue.value.trim()) {
    return allTags.value.filter(tag => !props.modelValue?.includes(tag))
  }

  const searchTerm = inputValue.value.toLowerCase()
  return allTags.value
    .filter(tag =>
      tag.toLowerCase().includes(searchTerm) &&
      !props.modelValue?.includes(tag)
    )
    .sort((a, b) => {
      // Prioritize tags that start with the search term
      const aStarts = a.toLowerCase().startsWith(searchTerm)
      const bStarts = b.toLowerCase().startsWith(searchTerm)
      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.localeCompare(b, 'ja')
    })
})

const calculateDropdownPosition = () => {
  if (!inputRef.value) return

  const inputRect = inputRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - inputRect.bottom
  const spaceAbove = inputRect.top
  const dropdownHeight = Math.min(filteredSuggestions.value.length * 40, 240) // Estimate dropdown height

  // If there's more space above or not enough space below, position above
  if (spaceAbove > spaceBelow && spaceAbove >= dropdownHeight) {
    dropdownPosition.value = 'top'
  } else {
    dropdownPosition.value = 'bottom'
  }
}

const handleFocus = () => {
  showSuggestions.value = true
  nextTick(() => calculateDropdownPosition())
}

const handleInput = () => {
  showSuggestions.value = true
  highlightedIndex.value = -1
  nextTick(() => calculateDropdownPosition())
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    if (highlightedIndex.value >= 0 && filteredSuggestions.value[highlightedIndex.value]) {
      addTag(filteredSuggestions.value[highlightedIndex.value])
    } else if (inputValue.value.trim()) {
      addTag(inputValue.value.trim())
    }
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    highlightedIndex.value = Math.min(highlightedIndex.value + 1, filteredSuggestions.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
  } else if (event.key === 'Escape') {
    showSuggestions.value = false
    highlightedIndex.value = -1
  }
}

const handleBlur = () => {
  // Delay hiding suggestions to allow click events to fire
  setTimeout(() => {
    showSuggestions.value = false
    highlightedIndex.value = -1
  }, 150)
}

const addTag = (tag: string) => {
  const trimmedTag = tag.trim()
  if (!trimmedTag || props.modelValue?.includes(trimmedTag)) return

  const newTags = [...(props.modelValue || []), trimmedTag]
  emit('update:modelValue', newTags)
  inputValue.value = ''
  showSuggestions.value = false
  highlightedIndex.value = -1

  nextTick(() => {
    inputRef.value?.focus()
  })
}

const addTagFromInput = () => {
  if (!inputValue.value.trim()) return
  addTag(inputValue.value.trim())
}

const removeTag = (index: number) => {
  const newTags = props.modelValue?.filter((_, i) => i !== index) || []
  emit('update:modelValue', newTags)
}

// Watch for changes to allTags to update suggestions
watch(allTags, () => {
  // Suggestions will update automatically due to computed property
})
</script>
