<template>
  <BaseDialog v-model:modelValue="show" size="md" @close="close">
    <template #header>
      <div class="px-4 py-3 flex items-center justify-between">
        <div class="text-lg text-gray-700 font-bold">{{ t('Manage Tags') }}</div>
        <button
          @click="close"
          class="text-gray-400 hover:text-gray-600 transition-colors p-1"
          title="Close"
        >
          <Icon icon="fal fa-times" size="1.2rem" />
        </button>
      </div>
    </template>

    <template #content>
      <div class="space-y-4 p-4">
        <div class="text-sm text-gray-600">
          {{ t('Rename tags or merge them by renaming to an existing tag name.') }}
        </div>

        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div
            v-for="tag in sortedTags"
            :key="tag"
            class="flex items-center space-x-2 p-2 border rounded"
          >
            <span class="flex-1 text-sm">{{ tag }}</span>
            <span class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {{ getTagCount(tag) }}
            </span>
            <Button @click="startRename(tag)" color="gray" class="!px-2 !py-1 !text-xs">
              <Icon icon="fal fa-edit" size="0.8rem" />
            </Button>
          </div>
        </div>

        <!-- Rename input -->
        <div v-if="renamingTag" class="border-t pt-4">
          <div class="space-y-2">
            <div class="text-sm font-medium">
              {{ t('Rename tag') }}: {{ renamingTag }}
            </div>
            <input
              ref="renameInput"
              v-model="newTagName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              :placeholder="t('New tag name')"
              @keydown.enter="confirmRename"
              @keydown.escape="cancelRename"
            />
            <div class="flex space-x-2">
              <Button @click="confirmRename" color="green" class="!px-3 !py-1 !text-xs">
                {{ t('Rename') }}
              </Button>
              <Button @click="cancelRename" color="gray" class="!px-3 !py-1 !text-xs">
                {{ t('Cancel') }}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="px-3 py-2 flex gap-3">
        <button
          class="cursor-pointer py-3 px-4 bg-gray-500 text-white rounded-lg drop-shadow flex-1 hover:bg-gray-600 transition-colors"
          @click="close"
        >
          {{ t('Close') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from 'vue'
import BaseDialog from './BaseDialog.vue'
import Button from './Button.vue'
import Icon from './Icon.vue'
import { t } from '~src/i18n'
import { recipes } from '~src/store/index'

interface Props {
  modelValue: boolean
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const show = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const renamingTag = ref<string | null>(null)
const newTagName = ref('')
const renameInput = ref<HTMLInputElement | null>(null)

// Get all unique tags
const allTags = computed(() => {
  const tagSet = new Set<string>()
  recipes.value.forEach(recipe => {
    if (recipe.tags) {
      recipe.tags.forEach(tag => tagSet.add(tag))
    }
  })
  return Array.from(tagSet)
})

// Sort tags alphabetically
const sortedTags = computed(() => {
  return [...allTags.value].sort((a, b) => a.localeCompare(b))
})

// Get count of recipes with a specific tag
function getTagCount(tag: string): number {
  return recipes.value.filter(recipe => recipe.tags?.includes(tag)).length
}

function startRename(tag: string) {
  renamingTag.value = tag
  newTagName.value = tag
  nextTick(() => {
    renameInput.value?.focus()
  })
}

function confirmRename() {
  if (!renamingTag.value || !newTagName.value.trim()) return

  const oldTag = renamingTag.value
  const newTag = newTagName.value.trim()

  if (oldTag === newTag) {
    cancelRename()
    return
  }

  // Update all recipes that have the old tag
  const updatedRecipes = recipes.value.map(recipe => {
    if (recipe.tags?.includes(oldTag)) {
      const newTags = recipe.tags.map(tag => tag === oldTag ? newTag : tag)
      // Remove duplicates if the new tag already exists
      const uniqueTags = [...new Set(newTags)]
      return { ...recipe, tags: uniqueTags }
    }
    return recipe
  })

  recipes.value = updatedRecipes

  renamingTag.value = null
  newTagName.value = ''
}

function cancelRename() {
  renamingTag.value = null
  newTagName.value = ''
}

function close() {
  cancelRename()
  show.value = false
}
</script>
