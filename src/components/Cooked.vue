<template>
  <div v-if="recipe" class="mt-4">
    <div class="rounded-lg border border-gray-800 bg-gray-900 text-white overflow-hidden">
      <div class="flex items-center justify-between px-3 py-2 border-b border-gray-800">
        <span class="text-xs font-semibold uppercase tracking-wide text-gray-300">{{ t('Cooked') }}</span>
        <Button
          v-if="!editMode"
          color="green"
          class="!px-3 !py-1 !text-xs"
          @click="addCookedEntry"
        >
          <Icon icon="fal fa-utensils-alt" class="mr-1" size="0.75rem" />
          {{ t('Cooked now') }}
        </Button>
      </div>
      <div class="px-3 py-2 space-y-1">
        <div
          v-if="entries.length === 0"
          class="text-xs text-gray-400"
        >
          {{ t('No cooked history yet') }}
        </div>
        <div
          v-for="(entry, index) in entries"
          :key="entry.cookedAt + '-' + index"
          class="flex items-center gap-2 rounded-md bg-gray-800 px-2 py-1 text-left text-xs leading-tight transition-colors hover:bg-gray-700 cursor-pointer"
          @click="openNoteModal(index)"
        >
          <div class="flex-1 min-w-0">
            <div class="font-semibold text-gray-100 truncate">
              {{ formatDate(entry.cookedAt) }}
            </div>
            <div v-if="entry.note" class="text-[11px] text-gray-300 truncate">
              {{ entry.note }}
            </div>
            <div v-else class="text-[11px] italic text-gray-500">
              {{ t('Add a note') }}
            </div>
          </div>
          <button
            v-if="editMode"
            type="button"
            class="shrink-0 rounded px-1 py-1 text-red-400 transition-colors hover:text-red-200"
            @click.stop="requestDelete(index)"
          >
            <Icon icon="fal fa-trash" size="0.75rem" />
          </button>
        </div>
      </div>
    </div>

    <BaseDialog v-model="showNoteModal" size="sm" @close="closeNoteModal">
      <template #header>
        <div class="px-4 py-2">
          <div class="text-base font-semibold text-white">
            {{ t('Cooked note') }}
          </div>
        </div>
      </template>
      <template #content>
        <div class="px-4 py-2 space-y-2">
          <p class="text-xs leading-snug text-gray-400">
            {{ t('Note can be how you cooked this time, what you changed or you would change next time.') }}
          </p>
          <div class="space-y-1">
            <label class="text-xs font-medium text-gray-500">{{ t('Cooked at') }}</label>
            <input
              v-model="noteDatetimeDraft"
              type="datetime-local"
              class="w-full rounded-md border border-gray-300 p-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <textarea
            ref="noteTextarea"
            v-model="noteDraft"
            class="w-full rounded-md border border-gray-300 p-2 text-sm text-black focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :placeholder="t('Write your note')"
            rows="4"
          />
        </div>
      </template>
      <template #footer>
        <div class="flex flex-wrap gap-2 px-3 py-2">
          <button
            v-if="selectedIndex >= 0"
            type="button"
            class="flex-1 rounded-lg border border-red-500 py-2 text-sm text-red-500 transition-colors hover:bg-red-500 hover:text-white"
            @click="deleteFromModal"
          >
            {{ t('Delete') }}
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg bg-gray-500 py-2 text-sm text-white transition-colors hover:bg-gray-600"
            @click="closeNoteModal"
          >
            {{ t('Cancel') }}
          </button>
          <button
            type="button"
            class="flex-1 rounded-lg bg-green-500 py-2 text-sm text-white transition-colors hover:bg-green-600"
            @click="saveNote"
          >
            {{ t('Save') }}
          </button>
        </div>
      </template>
    </BaseDialog>

    <ModalConfirm
      v-model="showDeleteConfirm"
      :removeName="deleteLabel"
      @confirm="deleteEntry"
      @cancel="cancelDelete"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import Button from './Button.vue'
import Icon from './Icon.vue'
import BaseDialog from './BaseDialog.vue'
import ModalConfirm from './ModalConfirm.vue'
import { recipes as recipesStore, type CookedEntry, type Recipe } from '~src/store/index'
import { t, currentLocale } from '~src/i18n'
import { vibrate } from '~src/services/vibrate'

const props = defineProps<{
  recipe?: Recipe | null
  editMode: boolean
}>()

const entries = computed((): CookedEntry[] => props.recipe?.cooked ?? [])

const showNoteModal = ref(false)
const noteDraft = ref('')
const noteDatetimeDraft = ref('')
const selectedIndex = ref(-1)
const noteTextarea = ref<HTMLTextAreaElement | null>(null)

const showDeleteConfirm = ref(false)
const pendingDeleteIndex = ref(-1)

const dateFormatter = computed(() => {
  try {
    return new Intl.DateTimeFormat(currentLocale.value || undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  } catch (error) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }
})

const deleteLabel = computed(() => {
  const entry = entries.value[pendingDeleteIndex.value]
  if (!entry) return ''
  return `${t('Cooked')} ${formatDate(entry.cookedAt)}`
})

watch(showNoteModal, (open) => {
  if (open) {
    nextTick(() => noteTextarea.value?.focus())
  }
})

watch(
  () => props.recipe?.id,
  () => {
    closeNoteModal()
    cancelDelete()
  }
)

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return dateFormatter.value.format(date)
}

function ensureCookedArray(recipe: Recipe) {
  if (!Array.isArray(recipe.cooked)) {
    recipe.cooked = []
  } else {
    recipe.cooked = recipe.cooked.map((entry) => ({ ...entry }))
  }
}

function updateRecipe(mutator: (recipe: Recipe) => void) {
  if (!props.recipe?.id) return
  const index = recipesStore.value.findIndex((item) => item.id === props.recipe?.id)
  if (index === -1) return
  const copy = [...recipesStore.value]
  const current = { ...copy[index] }
  mutator(current)
  copy[index] = current
  recipesStore.value = copy
}

function addCookedEntry() {
  updateRecipe((recipe) => {
    ensureCookedArray(recipe)
    recipe.cooked!.unshift({ cookedAt: new Date().toISOString() })
  })
}

function openNoteModal(index: number) {
  const entry = entries.value[index]
  if (!entry) return
  selectedIndex.value = index
  noteDraft.value = entry.note || ''
  noteDatetimeDraft.value = formatDatetimeForInput(entry.cookedAt)
  showNoteModal.value = true
}

function closeNoteModal() {
  showNoteModal.value = false
  selectedIndex.value = -1
  noteDraft.value = ''
  noteDatetimeDraft.value = ''
}

function saveNote() {
  if (selectedIndex.value < 0) {
    closeNoteModal()
    return
  }
  const trimmed = noteDraft.value.trim()
  updateRecipe((recipe) => {
    ensureCookedArray(recipe)
    const target = recipe.cooked?.[selectedIndex.value]
    if (!target) {
      return
    }
    const nextEntry: CookedEntry = { cookedAt: parseInputDatetime(noteDatetimeDraft.value, target.cookedAt) }
    if (trimmed) {
      nextEntry.note = trimmed
    }
    recipe.cooked![selectedIndex.value] = nextEntry
  })
  closeNoteModal()
}

function requestDelete(index: number) {
  vibrate()
  pendingDeleteIndex.value = index
  showDeleteConfirm.value = true
}

function deleteEntry() {
  if (pendingDeleteIndex.value < 0) {
    cancelDelete()
    return
  }
  updateRecipe((recipe) => {
    ensureCookedArray(recipe)
    if (!recipe.cooked) return
    recipe.cooked.splice(pendingDeleteIndex.value, 1)
  })
  closeNoteModal()
  cancelDelete()
}

function cancelDelete() {
  showDeleteConfirm.value = false
  pendingDeleteIndex.value = -1
}

function deleteFromModal() {
  if (selectedIndex.value < 0) return
  requestDelete(selectedIndex.value)
}

function formatDatetimeForInput(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function parseInputDatetime(value: string, fallback: string): string {
  if (!value) {
    return fallback
  }
  const [datePart, timePart] = value.split('T')
  if (!datePart || !timePart) {
    return fallback
  }
  const [yearStr, monthStr, dayStr] = datePart.split('-')
  const [hourStr, minuteStr] = timePart.split(':')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)
  const hour = Number(hourStr)
  const minute = Number(minuteStr)
  if ([year, month, day, hour, minute].some((part) => Number.isNaN(part))) {
    return fallback
  }
  const date = new Date(year, month - 1, day, hour, minute)
  if (Number.isNaN(date.getTime())) {
    return fallback
  }
  return date.toISOString()
}
</script>
