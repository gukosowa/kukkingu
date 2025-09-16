<template>
  <BaseDialog v-model="showModal" size="lg" @close="close">
    <template #header>
      <div class="px-4 py-3">
        <div class="text-lg text-gray-600 font-bold">
          {{ t('Shopping List') }}
        </div>
        <div class="text-sm text-gray-500 mt-1">{{ planName }}</div>
      </div>
    </template>

    <template #content>
      <div v-if="shoppingList.length === 0" class="text-center py-8">
        <Icon icon="fal fa-shopping-cart" size="3rem" class="text-gray-300 mb-4" />
        <h3 class="text-lg font-semibold text-gray-700 mb-2">{{ t('No ingredients') }}</h3>
        <p class="text-gray-500">{{ t('Your shopping list is empty') }}</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in shoppingList"
          :key="item.name + item.amountType"
          class="flex items-center gap-3 p-3 rounded-lg bg-gray-900 text-white cursor-pointer hover:bg-gray-800"
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
                {{ formatAmount(item.amount) }} {{ item.amountType }}
              </span>
            </div>
            <div v-if="item.recipes.length > 0" class="text-xs text-gray-300 mt-1">
              {{ t('Used in') }}: {{ getRecipeNames(item.recipes).join(', ') }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="px-4 py-3">
        <div class="flex gap-4 items-center justify-between mb-4">
          <div class="text-sm text-gray-600">
            {{ checkedCount }} / {{ shoppingList.length }} {{ t('items checked') }}
          </div>
          <button
            class="cursor-pointer py-3 px-4 bg-blue-500 text-white rounded-lg drop-shadow hover:bg-blue-700 transition-colors"
            @click.stop="clearAll"
          >
            {{ t('Clear All') }}
          </button>
        </div>
        <button
          class="cursor-pointer py-3 px-4 bg-gray-500 text-white rounded-lg drop-shadow hover:bg-gray-600 transition-colors w-full"
          @click.stop="close"
        >
          {{ t('Close') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { t } from '~src/i18n'
import { ShoppingListItem, recipes } from '~src/store/index'
import { updateShoppingListItem } from '~src/store/index'
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
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Computed
const checkedCount = computed(() =>
  props.shoppingList.filter(item => item.checked).length
)

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
  // Format amount with appropriate precision
  if (amount % 1 === 0) {
    return amount.toString()
  } else if (amount < 0.1) {
    return amount.toFixed(2)
  } else {
    return amount.toFixed(1)
  }
}

function getRecipeNames(recipeIds: string[]): string[] {
  return recipeIds.map(recipeId => {
    const recipe = recipes.value.find(r => r.id === recipeId)
    return recipe?.name || recipeId
  })
}
</script>

