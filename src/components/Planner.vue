<template>
  <div class="flex-grow flex flex-col p-4">
    <!-- Header -->
    <div class="mb-6">
      <div class="mb-4">
        <h1 class="text-2xl font-bold">{{ t('Weekly Planner') }}</h1>
        <p class="text-gray-600 mt-1">{{ t('Plan your meals for the week') }}</p>
      </div>
      <div class="flex gap-2">
        <Button @click="showCreateModal = true" class="bg-blue-600 hover:bg-blue-700">
          <Icon icon="fal fa-plus" size="0.9rem" class="mr-1" />
          {{ t('Create Plan') }}
        </Button>
        <Button @click="showAutoPlanModal = true" class="bg-green-600 hover:bg-green-700">
          <Icon icon="fal fa-magic" size="0.9rem" class="mr-1" />
          {{ t('Auto Plan') }}
        </Button>
        <Button @click="showImportModal = true" class="bg-purple-600 hover:bg-purple-700">
          <Icon icon="fal fa-file-import" size="0.9rem" class="mr-1" />
          {{ t('Import') }}
        </Button>
      </div>
    </div>

    <!-- Plans List -->
    <div v-if="weeklyPlans.length === 0" class="bg-gray-50 rounded-lg p-8 text-center flex-grow">
      <Icon icon="fal fa-calendar-week" size="4rem" class="text-gray-300 mb-4" />
      <h3 class="text-lg font-semibold text-gray-700 mb-2">{{ t('No plans yet') }}</h3>
      <p class="text-gray-500 mb-4">{{ t('Create your first weekly meal plan to get started') }}</p>
      <Button @click="showCreateModal = true" class="bg-blue-600 hover:bg-blue-700">
        {{ t('Create Plan') }}
      </Button>
    </div>

    <!-- Plans Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-grow">
      <div
        v-for="plan in sortedWeeklyPlans"
        :key="plan.id"
        class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex-grow">
            <h3 class="font-semibold text-lg text-gray-900">{{ plan.name }}</h3>
            <p class="text-sm text-gray-500">
              {{ formatWeekRange(plan.startDate) }}
            </p>
          </div>
          <Button
            @click="deletePlan(plan.id)"
            class="bg-red-600 hover:bg-red-700 text-white p-2"
            :title="t('Delete')"
          >
            <Icon icon="fal fa-trash" size="0.9rem" />
          </Button>
        </div>

        <div class="space-y-2 mb-4">
          <div
            v-for="day in plan.days.slice(0, 3)"
            :key="day.date"
            class="flex items-center text-sm"
          >
            <span class="w-12 text-gray-500">{{ formatDayShort(day.date) }}</span>
            <span class="text-gray-700">{{ day.recipes.length }} {{ t('recipes') }}</span>
          </div>
          <div v-if="plan.days.length > 3" class="text-sm text-gray-500">
            +{{ plan.days.length - 3 }} more days
          </div>
        </div>

        <div class="flex gap-2">
          <Button
            @click="openPlan(plan)"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Icon icon="fal fa-edit" size="0.8rem" class="mr-1" />
            {{ t('Edit') }}
          </Button>
          <Button
            @click="generateShoppingList(plan)"
            class="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <Icon icon="fal fa-shopping-cart" size="0.8rem" class="mr-1" />
            {{ t('Shopping List') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Create Plan Modal -->
    <ModalInput
      v-model="showCreateModal"
      :title="t('Create Weekly Plan')"
      :confirmText="t('Create')"
      :cancelText="t('Cancel')"
      :placeholder="t('Plan name')"
      @confirm="createPlan"
      @cancel="showCreateModal = false"
    />

    <!-- Auto Plan Modal -->
    <ModalConfirm
      v-model="showAutoPlanModal"
      :title="t('Generate Auto Meal Plan')"
      :message="t('Let GPT create a balanced meal plan for the week using your recipes.')"
      :confirmText="t('Generate')"
      :cancelText="t('Cancel')"
      @confirm="generateAutoPlan"
      @cancel="showAutoPlanModal = false"
    />

    <!-- Import Modal -->
    <ModalInput
      v-model="showImportModal"
      :title="t('Import Weekly Plan')"
      :confirmText="t('Import')"
      :cancelText="t('Cancel')"
      :placeholder="t('Paste JSON here')"
      :multiline="true"
      @confirm="importPlan"
      @cancel="showImportModal = false"
    />

    <!-- Plan Editor Modal (simplified for now) -->
    <div
      v-if="editingPlan"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div class="p-6 border-b">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-semibold">{{ editingPlan.name }}</h2>
            <Button @click="closePlanEditor" class="text-gray-500 hover:text-gray-700">
              <Icon icon="fal fa-times" size="1.2rem" />
            </Button>
          </div>
          <p class="text-sm text-gray-500 mt-1">{{ formatWeekRange(editingPlan.startDate) }}</p>
        </div>

        <div class="p-6 max-h-96 overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div
              v-for="day in editingPlan.days"
              :key="day.date"
              class="bg-gray-50 rounded-lg p-3"
            >
              <h4 class="font-medium text-gray-900 mb-2">{{ formatDay(day.date) }}</h4>
              <div class="space-y-1">
                <div
                  v-for="recipePlan in day.recipes"
                  :key="recipePlan.recipeId"
                  class="bg-white rounded px-2 py-1 text-sm flex items-center justify-between"
                >
                  <span class="truncate">{{ getRecipeName(recipePlan.recipeId) }}</span>
                  <span class="text-xs text-gray-500 ml-1">{{ recipePlan.servings }}x</span>
                </div>
                <div v-if="day.recipes.length === 0" class="text-xs text-gray-400 italic">
                  {{ t('No recipes') }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 border-t bg-gray-50">
          <div class="flex justify-end gap-2">
            <Button @click="generateShoppingList(editingPlan)" class="bg-green-600 hover:bg-green-700">
              <Icon icon="fal fa-shopping-cart" size="0.9rem" class="mr-1" />
              {{ t('Shopping List') }}
            </Button>
            <Button @click="closePlanEditor" class="bg-gray-600 hover:bg-gray-700">
              {{ t('Close') }}
            </Button>
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '~src/i18n'
import { weeklyPlans, createWeeklyPlan, removeWeeklyPlan, WeeklyPlan } from '~src/store/index'
import { generateShoppingList as generateList, generateAutoMealPlanPrompt, importPlanFromJson } from '~src/services/planner'
import { openChatGPT } from '~src/services/chatgpt'
import { recipes } from '~src/store/index'
import Icon from './Icon.vue'
import Footer from './Footer.vue'
import Button from './Button.vue'
import ModalInput from './ModalInput.vue'
import ModalConfirm from './ModalConfirm.vue'

const router = useRouter()

// State
const showCreateModal = ref(false)
const showAutoPlanModal = ref(false)
const showImportModal = ref(false)
const editingPlan = ref<WeeklyPlan | null>(null)

// Computed
const sortedWeeklyPlans = computed(() =>
  [...weeklyPlans.value].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
)

// Functions
async function createPlan(planName: string) {
  if (!planName.trim()) return

  try {
    // Get the start of the current week (Monday)
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday

    await createWeeklyPlan(planName.trim(), startOfWeek.toISOString().split('T')[0])
    showCreateModal.value = false
  } catch (error) {
    console.error('Failed to create plan:', error)
  }
}

async function generateAutoPlan() {
  showAutoPlanModal.value = false

  try {
    const prompt = generateAutoMealPlanPrompt()
    await openChatGPT(prompt)
    // The user will need to copy the GPT response and import it manually
  } catch (error) {
    console.error('Failed to generate auto plan prompt:', error)
  }
}

async function importPlan(jsonString: string) {
  showImportModal.value = false

  try {
    const plan = importPlanFromJson(jsonString)
    if (plan) {
      // Check if plan with same ID already exists
      const existingIndex = weeklyPlans.value.findIndex(p => p.id === plan.id)
      if (existingIndex !== -1) {
        // Update existing plan
        weeklyPlans.value[existingIndex] = plan
      } else {
        // Add new plan
        weeklyPlans.value.push(plan)
      }
    }
  } catch (error) {
    console.error('Failed to import plan:', error)
    alert(t('Invalid JSON'))
  }
}

function openPlan(plan: WeeklyPlan) {
  editingPlan.value = plan
}

function closePlanEditor() {
  editingPlan.value = null
}

async function deletePlan(planId: string) {
  if (confirm(t('Really delete this plan?'))) {
    try {
      await removeWeeklyPlan(planId)
    } catch (error) {
      console.error('Failed to delete plan:', error)
    }
  }
}

function generateShoppingList(plan: WeeklyPlan) {
  const shoppingList = generateList(plan)

  // For now, just log the shopping list
  // TODO: Create a shopping list modal/component
  console.log('Shopping list for', plan.name, ':', shoppingList)

  // You could open a shopping list modal here
  // showShoppingListModal.value = true
  // shoppingListData.value = shoppingList
}

// Helper functions
function formatWeekRange(startDate: string): string {
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const formatDate = (date: Date) =>
    date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

  return `${formatDate(start)} - ${formatDate(end)}`
}

function formatDay(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function formatDayShort(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

function getRecipeName(recipeId: string): string {
  const recipe = recipes.value.find(r => r.id === recipeId)
  return recipe?.name || t('Unknown recipe')
}
</script>
