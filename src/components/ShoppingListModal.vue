<template>
  <BaseDialog v-model="showModal" size="lg" @close="close" contentClass="px-2 py-2" class="!p-2">
    <template #header>
      <div class="px-4 py-3">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="text-lg text-gray-600 font-bold">
              {{ t('Shopping List') }}
            </div>
            <div class="text-sm text-gray-500 mt-1">{{ planName }}</div>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="hasNotes"
              @click="showNotes = !showNotes"
              class="flex items-center px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              :title="showNotes ? t('Hide notes') : t('Show notes')"
            >
              <Icon :icon="showNotes ? 'fal fa-eye-slash' : 'fal fa-eye'" size="0.9rem" class="mr-2" />
              <span class="text-sm font-medium">{{ t('Notes') }}</span>
            </button>
            <button
              @click="denseMode = !denseMode"
              class="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
              :title="denseMode ? t('Normal view') : t('Compact view')"
            >
              <Icon :icon="denseMode ? 'fal fa-expand' : 'fal fa-compress'" size="1rem" class="text-gray-600" />
            </button>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <div v-if="shoppingList.length === 0" class="text-center py-8">
        <Icon icon="fal fa-shopping-cart" size="3rem" class="text-gray-300 mb-4" />
        <h3 class="text-lg font-semibold text-gray-700 mb-2">{{ t('No ingredients') }}</h3>
        <p class="text-gray-500">{{ t('Your shopping list is empty') }}</p>
      </div>

      <div v-else>
        <TransitionGroup
          name="shopping-item"
          tag="div"
          :class="[
            'shopping-list-container',
            { 'dense-mode': denseMode }
          ]"
        >
          <div
            v-for="item in sortedShoppingList"
            :key="item.name + item.amountType"
            :class="[
              'flex items-center gap-3 rounded-lg bg-gray-900 text-white cursor-pointer hover:bg-gray-800 shopping-list-item',
              denseMode ? 'p-2 text-sm' : 'p-3'
            ]"
            @click.stop="toggleItemChecked(item)"
          >
            <Checkbox
              v-model="item.checked"
              @change="updateItemChecked(item)"
              @click.stop
              class="flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-white truncate">{{ item.name }}</span>
                <span class="text-sm text-gray-300 flex-shrink-0">
                  <template v-if="unitBefore(item.amountType)">
                    {{ unitLabel(item.amountType) }} {{ formatAmount(item.amount) }}
                  </template>
                  <template v-else>
                    {{ formatAmount(item.amount) }} {{ unitLabel(item.amountType) }}
                  </template>
                </span>
                <button
                  v-if="item.recipes.length > 0"
                  @click.stop="showRecipeInfo(item)"
                  class="text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-600 transition-colors flex-shrink-0"
                  :title="t('Show recipes using this ingredient')"
                >
                  <Icon icon="fal fa-question-circle" size="0.8rem" />
                </button>
              </div>
              <div v-if="item.recipes.length > 0 && !denseMode" class="text-xs text-gray-300 mt-1">
                {{ t('Used in') }}: {{ getRecipeNames(item.recipes).join(', ') }}
              </div>
              <div
                v-if="showNotes && getItemNotes(item).length > 0 && !denseMode"
                class="text-xs text-gray-400 mt-1 space-y-1"
              >
                <div
                  v-for="(note, noteIndex) in getItemNotes(item)"
                  :key="noteIndex"
                  class="leading-snug"
                >
                  {{ note }}
                </div>
              </div>
            </div>
          </div>
        </TransitionGroup>
      </div>
    </template>

    <template #footer>
      <div class="px-1 py-1">
        <div class="flex flex-wrap gap-1 items-center justify-between mb-2">
          <div class="text-sm text-gray-600">
            {{ checkedCount }} / {{ shoppingList.length }} {{ t('items checked') }}
          </div>
          <div class="flex gap-2">
            <button
              class="cursor-pointer py-1 px-4 bg-green-500 text-white rounded-lg drop-shadow hover:bg-green-700 transition-colors"
              @click.stop="shareShoppingList"
            >
              <Icon icon="fal fa-share" size="0.9rem" class="mr-1" />
              {{ t('Share') }}
            </button>
            <button
              class="cursor-pointer py-1 px-4 bg-blue-500 text-white rounded-lg drop-shadow hover:bg-blue-700 transition-colors"
              @click.stop="clearAll"
            >
              {{ t('Clear All') }}
            </button>
          </div>
        </div>
        <button
          class="cursor-pointer py-1 px-4 bg-gray-500 text-white rounded-lg drop-shadow hover:bg-gray-600 transition-colors w-full"
          @click.stop="close"
        >
          {{ t('Close') }}
        </button>
      </div>
    </template>
  </BaseDialog>

  <!-- Recipe Selection Modal -->
  <div
    v-if="showRecipeModal"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-lg p-6 max-w-md w-full">
      <h3 class="text-lg font-semibold text-gray-900 mb-4">
        {{ t('Select Recipe') }}
      </h3>
      <p class="text-sm text-gray-600 mb-4">
        {{ t('This ingredient is used in multiple recipes:') }}
      </p>
      <div class="space-y-2 max-h-60 overflow-y-auto">
        <button
          v-for="recipeId in currentRecipeList"
          :key="recipeId"
          @click="navigateToRecipe(recipeId)"
          class="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <span class="font-medium">{{ getRecipeNames([recipeId])[0] || recipeId }}</span>
        </button>
      </div>
      <div class="mt-6 flex gap-3">
        <Button
          @click="closeRecipeModal"
          class="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
        >
          {{ t('Cancel') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { t } from '~src/i18n'
import { recipes } from '~src/store/index'
import type { ShoppingListItem } from '~src/store/index'
import { updateShoppingListItem } from '~src/store/index'
import { normalizeAmountType } from '~src/services/units'
import Button from './Button.vue'
import Checkbox from './Checkbox.vue'
import Icon from './Icon.vue'
import BaseDialog from './BaseDialog.vue'

interface Props {
  modelValue: boolean
  shoppingList: ShoppingListItem[]
  planName: string
  planId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'navigate-to-recipe', recipeId: string): void
  (e: 'before-navigate-to-recipe', recipeId: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Recipe selection modal state
const showRecipeModal = ref(false)
const currentRecipeList = ref<string[]>([])

// Dense mode state (local to this modal)
const denseMode = ref(false)
const showNotes = ref(false)

// Computed
const checkedCount = computed(() =>
  props.shoppingList.filter(item => item.checked).length
)

const sortedShoppingList = computed(() => {
  // Separate checked and unchecked items
  const unchecked = props.shoppingList.filter(item => !item.checked)
  const checked = props.shoppingList.filter(item => item.checked)

  // Sort each group alphabetically by name
  const sortByName = (a: ShoppingListItem, b: ShoppingListItem) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())

  unchecked.sort(sortByName)
  checked.sort(sortByName)

  // Return unchecked items first, then checked items
  return [...unchecked, ...checked]
})

const hasNotes = computed(() =>
  props.shoppingList.some(item => getItemNotes(item).length > 0)
)

watch(hasNotes, (value) => {
  if (!value) {
    showNotes.value = false
  } else if (!showNotes.value) {
    showNotes.value = true
  }
}, { immediate: true })

// Functions
function close() {
  showModal.value = false
}

function clearAll() {
  props.shoppingList.forEach(item => {
    item.checked = false
    updateShoppingListItem(props.planId, item)
  })
}

function updateItemChecked(item: ShoppingListItem) {
  updateShoppingListItem(props.planId, item)
}

function toggleItemChecked(item: ShoppingListItem) {
  item.checked = !item.checked
  updateShoppingListItem(props.planId, item)
}

function formatAmount(amount: number): string {
  if (!Number.isFinite(amount)) {
    return '0'
  }
  if (amount % 1 === 0) {
    return amount.toString()
  }
  return Math.ceil(amount).toString()
}

function getRecipeNames(recipeIds: string[]): string[] {
  return recipeIds.map(recipeId => {
    const recipe = recipes.value.find(r => r.id === recipeId)
    return recipe?.name || recipeId
  })
}

function getItemNotes(item: ShoppingListItem): string[] {
  if (!item.notes) {
    return []
  }
  const uniqueNotes = new Set<string>()
  item.notes.forEach(note => {
    if (typeof note === 'string') {
      const trimmed = note.trim()
      if (trimmed) {
        uniqueNotes.add(trimmed)
      }
    }
  })
  return Array.from(uniqueNotes)
}

async function shareShoppingList() {
  const uncheckedItems = props.shoppingList.filter(item => !item.checked)

  if (uncheckedItems.length === 0) {
    showAppNotice(t('No items to share'), t('All items are already checked'), 'fal fa-info-circle')
    return
  }

  // Sort unchecked items alphabetically
  const sortedItems = uncheckedItems.sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )

  // Create shareable text
  const allRecipeIds = [...new Set(sortedItems.flatMap(item => item.recipes))]
  const allRecipeNames = getRecipeNames(allRecipeIds)
  const recipeList = allRecipeNames.join(', ')
  let shareText = `${t('Shoppinglist for:')} ${recipeList}\n\n`

  sortedItems.forEach(item => {
    const recipeNames = getRecipeNames(item.recipes)
    const usedInText = recipeNames.length > 0 ? recipeNames.join(', ') : ''

    let amountText = ''
    if (unitBefore(item.amountType)) {
      amountText = `${unitLabel(item.amountType)} ${formatAmount(item.amount)}`
    } else {
      amountText = `${formatAmount(item.amount)} ${unitLabel(item.amountType)}`
    }

    shareText += `- ${item.name} - ${amountText}\n`
  })

  try {
    // Try to use Web Share API if available
    if (navigator.share) {
      await navigator.share({
        title: `${t('Shoppinglist for:')} ${recipeList}`,
        text: shareText
      })
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText)
        showAppNotice(t('Copied to clipboard'), t('Shopping list copied to clipboard'), 'fal fa-check-circle')
      } catch (clipboardError) {
        // Fallback to legacy clipboard
        legacyCopyToClipboard(shareText)
        showAppNotice(t('Copied to clipboard'), t('Shopping list copied to clipboard'), 'fal fa-check-circle')
      }
    }
  } catch (error) {
    console.error('Failed to share shopping list:', error)
    // Try legacy clipboard as last resort
    try {
      legacyCopyToClipboard(shareText)
      showAppNotice(t('Copied to clipboard'), t('Shopping list copied to clipboard'), 'fal fa-check-circle')
    } catch (legacyError) {
      showAppNotice(t('Share failed'), t('Unable to share shopping list'), 'fal fa-exclamation-triangle')
    }
  }
}

// Legacy clipboard copy for widest compatibility
function legacyCopyToClipboard(text: string) {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  } catch (_) {
    /* no-op */
  }
}

function unitLabel(type: string): string {
  return t('full_' + normalizeAmountType(type))
}

function unitBefore(type: string): boolean {
  return ['tbl', 'tea'].includes(normalizeAmountType(type))
}

function showRecipeInfo(item: ShoppingListItem) {
  if (item.recipes.length === 1) {
    // Navigate directly to the single recipe
    navigateToRecipe(item.recipes[0])
  } else if (item.recipes.length > 1) {
    // Show modal to choose which recipe to navigate to
    currentRecipeList.value = item.recipes
    showRecipeModal.value = true
  }
}

function navigateToRecipe(recipeId: string) {
  // First emit event to save state, then close modal
  emit('before-navigate-to-recipe', recipeId)
  // Close the shopping list modal
  showModal.value = false
  // Navigate to the recipe (this assumes we have access to router)
  // Since this is a modal, we'll emit an event to the parent component
  emit('navigate-to-recipe', recipeId)
}

function closeRecipeModal() {
  showRecipeModal.value = false
  currentRecipeList.value = []
}

function showAppNotice(title: string, message: string, icon?: string) {
  // Create a simple notification (you can enhance this with a proper toast system)
  console.log(`${title}: ${message}`)
}
</script>

<style scoped>
.shopping-list-container {
  display: flex;
  flex-direction: column;
}

.shopping-list-container:not(.dense-mode) {
  gap: 0.75rem; /* space-y-3 */
}

.shopping-list-container.dense-mode {
  gap: 0.5rem; /* space-y-2 */
}

/* Transition animations for shopping list items */
.shopping-item-enter-active,
.shopping-item-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.shopping-item-move {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.shopping-item-enter-from {
  opacity: 0;
  transform: translateY(-15px) scale(0.95);
}

.shopping-item-leave-to {
  opacity: 0;
  transform: translateY(15px) scale(0.95);
}

.shopping-item-leave-active {
  position: absolute;
  width: 100%;
}
</style>
