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
        <div class="w-full min-h-full px-6 sm:px-12 py-8 flex flex-col transform">
          <div class="w- bg-white rounded-xl drop-shadow flex flex-col overflow-hidden" @click.stop>
            <!-- Header -->
            <div class="px-4 py-3 border-b border-gray-200">
              <div class="text-lg text-gray-600 font-bold">
                {{ t('Shopping List') }}
              </div>
              <div class="text-sm text-gray-500 mt-1">{{ planName }}</div>
            </div>

            <!-- Content -->
            <div class="p-5">
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
            </div>

            <!-- Footer -->
            <div class="py-3 px-3 border-t border-gray-200 bg-gray-50">
              <div class="flex gap-4 items-center justify-between">
                <div class="text-sm text-gray-600">
                  {{ checkedCount }} / {{ shoppingList.length }} {{ t('items checked') }}
                </div>
                <div class="flex gap-4">
                  <div
                    class="cursor-pointer py-2 px-4 bg-gray-500 text-white rounded-lg drop-shadow flex-1"
                    @click.stop="clearAll"
                  >
                    {{ t('Clear All') }}
                  </div>
                  <div
                    class="cursor-pointer py-2 px-4 bg-blue-500 text-white rounded-lg drop-shadow flex-1"
                    @click.stop="close"
                  >
                    {{ t('Close') }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
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

<style scoped>
  .drop-shadow {
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))
      drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
  }
</style>
