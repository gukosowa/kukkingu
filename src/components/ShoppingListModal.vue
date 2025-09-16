<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
  >
    <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex-shrink-0 px-6 py-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">{{ t('Shopping List') }}</h2>
          <div class="flex gap-2">
            <Button
              @click="clearAll"
              class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 text-sm"
              :disabled="shoppingList.length === 0"
            >
              {{ t('Clear All') }}
            </Button>
            <Button
              @click="close"
              class="bg-gray-500 hover:bg-gray-600 text-white p-2"
            >
              <Icon icon="fal fa-times" size="0.9rem" />
            </Button>
          </div>
        </div>
        <p class="text-sm text-gray-500 mt-1">{{ planName }}</p>
      </div>

      <!-- Shopping List Content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="shoppingList.length === 0" class="text-center py-8">
          <Icon icon="fal fa-shopping-cart" size="3rem" class="text-gray-300 mb-4" />
          <h3 class="text-lg font-semibold text-gray-700 mb-2">{{ t('No ingredients') }}</h3>
          <p class="text-gray-500">{{ t('Your shopping list is empty') }}</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in shoppingList"
            :key="item.name + item.amountType"
            class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <Checkbox
              v-model="item.checked"
              @change="updateItemChecked(item)"
              class="flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900 truncate">{{ item.name }}</span>
                <span class="text-sm text-gray-500 flex-shrink-0">
                  {{ formatAmount(item.amount) }} {{ item.amountType }}
                </span>
              </div>
              <div v-if="item.recipes.length > 0" class="text-xs text-gray-500 mt-1">
                {{ t('Used in') }}: {{ getRecipeNames(item.recipes).join(', ') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div class="text-sm text-gray-600">
          {{ checkedCount }} / {{ shoppingList.length }} {{ t('items checked') }}
        </div>
        <Button
          @click="close"
          class="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {{ t('Close') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { t } from '~src/i18n'
import { ShoppingListItem, recipes } from '~src/store/index'
import { updateShoppingListItem } from '~src/store/index'
import Button from './Button.vue'
import Checkbox from './Checkbox.vue'
import Icon from './Icon.vue'

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

// Computed
const checkedCount = computed(() =>
  props.shoppingList.filter(item => item.checked).length
)

// Functions
function close() {
  emit('update:modelValue', false)
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

<style scoped>
</style>
