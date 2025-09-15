<template>
  <div class="flex-grow flex flex-col p-4">
    <!-- Header -->
    <div class="mb-6">
      <div class="mb-4">
        <h1 class="text-2xl font-bold">{{ t('Planner') }}</h1>
        <p class="text-gray-600 mt-1">{{ t('Plan your meals for any period') }}</p>
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
      <p class="text-gray-500 mb-4">{{ t('Create your first meal plan to get started') }}</p>
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
              {{ formatWeekRange(plan) }}
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
            <span class="w-12 text-gray-500">{{ formatDayShort(day.date, plan.startDate) }}</span>
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
    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg max-w-md w-full">
        <div class="p-6">
          <h2 class="text-xl font-semibold mb-4">{{ t('Create Plan') }}</h2>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('Plan name') }}</label>
              <SInput
                v-model="newPlanName"
                :placeholder="t('Enter plan name')"
                class="w-full"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('Day length') }}</label>
              <SInput
                v-model.number="newPlanDayLength"
                :placeholder="t('Number of days')"
                class="w-full"
                type="number"
                :min="1"
                :max="30"
              />
              <p class="text-xs text-gray-500 mt-1">{{ t('How many days should this plan cover?') }}</p>
            </div>
          </div>
        </div>

        <div class="px-6 pb-6 flex gap-3">
          <Button
            @click="createPlan"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            :disabled="!newPlanName.trim() || !newPlanDayLength || newPlanDayLength < 1"
          >
            {{ t('Create') }}
          </Button>
          <Button
            @click="closeCreateModal"
            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
          >
            {{ t('Cancel') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Auto Plan Modal -->
    <div
      v-if="showAutoPlanModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] flex flex-col">
        <!-- Header - Fixed at top -->
        <div class="flex-shrink-0 p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold">{{ t('Generate Auto Meal Plan') }}</h2>
        </div>

        <!-- Content - Scrollable -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="space-y-6">
            <!-- Length Input -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('Plan Length (Days)') }}</label>
              <SInput
                v-model.number="autoPlanLength"
                :placeholder="t('Number of days')"
                class="w-full"
                type="number"
                :min="1"
                :max="30"
              />
              <p class="text-xs text-gray-500 mt-1">{{ t('How many days should this plan cover?') }}</p>
            </div>

            <!-- Preferences -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('Preferred Tags') }}</label>
              <p class="text-xs text-gray-500 mb-2">{{ t('Select tags for recipes you prefer to include') }}</p>
              <div class="min-h-[120px] max-h-48 overflow-y-auto border rounded-lg p-2">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="tag in allTags"
                    :key="tag"
                    @click="togglePreference(tag)"
                    :class="[
                      'px-3 py-1 text-sm rounded-full border transition-colors',
                      autoPlanPreferences.includes(tag)
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    ]"
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Exclusions -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('Excluded Tags') }}</label>
              <p class="text-xs text-gray-500 mb-2">{{ t('Select tags for recipes you want to exclude') }}</p>
              <div class="min-h-[120px] max-h-48 overflow-y-auto border rounded-lg p-2">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="tag in allTags"
                    :key="tag"
                    @click="toggleExclusion(tag)"
                    :class="[
                      'px-3 py-1 text-sm rounded-full border transition-colors',
                      autoPlanExclusions.includes(tag)
                        ? 'bg-red-100 border-red-300 text-red-700'
                        : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                    ]"
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer - Fixed at bottom -->
        <div class="flex-shrink-0 px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
          <Button
            @click="generateAutoPlan"
            class="flex-1 bg-green-600 hover:bg-green-700 text-white"
            :disabled="!autoPlanLength || autoPlanLength < 1"
          >
            {{ t('Generate') }}
          </Button>
          <Button
            @click="closeAutoPlanModal"
            class="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
          >
            {{ t('Cancel') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <ModalInput
      v-model="showImportModal"
      :title="t('Import Plan')"
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
          <p class="text-sm text-gray-500 mt-1">{{ formatWeekRange(editingPlan) }}</p>
        </div>

        <div class="p-6 max-h-96 overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-7 gap-4">
            <div
              v-for="day in editingPlan.days"
              :key="day.date"
              class="bg-gray-50 rounded-lg p-3"
            >
              <h4 class="font-medium text-gray-900 mb-2">{{ formatDay(day.date, editingPlan.startDate) }}</h4>
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

    <!-- Delete Confirmation Modal -->
    <ModalConfirm
      v-model="showDeleteModal"
      :removeName="planToDelete?.name"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />

    <!-- Notice Modal -->
    <ModalNotice
      v-model="showNoticeModal"
      :title="t('Error')"
      :message="noticeMessage"
      icon="fal fa-exclamation-triangle"
    />

    <Footer />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '~src/i18n'
import { weeklyPlans, createWeeklyPlan, removeWeeklyPlan, WeeklyPlan, getAllTags } from '~src/store/index'
import { generateShoppingList as generateList, generateAutoMealPlanPrompt, importPlanFromJson } from '~src/services/planner'
import { openChatGPT } from '~src/services/chatgpt'
import { recipes } from '~src/store/index'
import Icon from './Icon.vue'
import Footer from './Footer.vue'
import Button from './Button.vue'
import ModalInput from './ModalInput.vue'
import ModalConfirm from './ModalConfirm.vue'
import ModalNotice from './ModalNotice.vue'
import SInput from './Input.vue'

const router = useRouter()

// State
const showCreateModal = ref(false)
const showAutoPlanModal = ref(false)
const showImportModal = ref(false)
const showDeleteModal = ref(false)
const showNoticeModal = ref(false)
const noticeMessage = ref('')
const editingPlan = ref<WeeklyPlan | null>(null)
const planToDelete = ref<WeeklyPlan | null>(null)
const newPlanName = ref('')
const newPlanDayLength = ref(7)
const autoPlanLength = ref(7)
const autoPlanPreferences = ref<string[]>([])
const autoPlanExclusions = ref<string[]>([])

// Computed
const sortedWeeklyPlans = computed(() =>
  [...weeklyPlans.value].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
)

const allTags = computed(() => getAllTags())

// Functions
async function createPlan() {
  if (!newPlanName.value.trim() || !newPlanDayLength.value || newPlanDayLength.value < 1) return

  try {
    // Get today's date as start date
    const today = new Date()
    const startDate = today.toISOString().split('T')[0]

    await createWeeklyPlan(newPlanName.value.trim(), startDate, newPlanDayLength.value)
    closeCreateModal()
  } catch (error) {
    console.error('Failed to create plan:', error)
  }
}

function closeCreateModal() {
  showCreateModal.value = false
  newPlanName.value = ''
  newPlanDayLength.value = 7
}

async function generateAutoPlan() {
  if (!autoPlanLength.value || autoPlanLength.value < 1) return

  try {
    const prompt = generateAutoMealPlanPrompt({
      length: autoPlanLength.value,
      preferences: autoPlanPreferences.value,
      exclusions: autoPlanExclusions.value
    })
    await openChatGPT(prompt)
    // The user will need to copy the GPT response and import it manually
  } catch (error) {
    console.error('Failed to generate auto plan prompt:', error)
  } finally {
    closeAutoPlanModal()
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
    noticeMessage.value = t('Invalid JSON')
    showNoticeModal.value = true
  }
}

function openPlan(plan: WeeklyPlan) {
  editingPlan.value = plan
}

function closePlanEditor() {
  editingPlan.value = null
}

async function deletePlan(planId: string) {
  const plan = weeklyPlans.value.find(p => p.id === planId)
  if (plan) {
    planToDelete.value = plan
    showDeleteModal.value = true
  }
}

async function confirmDelete() {
  if (planToDelete.value) {
    try {
      await removeWeeklyPlan(planToDelete.value.id)
    } catch (error) {
      console.error('Failed to delete plan:', error)
    }
    showDeleteModal.value = false
    planToDelete.value = null
  }
}

function cancelDelete() {
  showDeleteModal.value = false
  planToDelete.value = null
}

function togglePreference(tag: string) {
  const index = autoPlanPreferences.value.indexOf(tag)
  if (index > -1) {
    autoPlanPreferences.value.splice(index, 1)
  } else {
    autoPlanPreferences.value.push(tag)
    // Remove from exclusions if it was there
    const exclusionIndex = autoPlanExclusions.value.indexOf(tag)
    if (exclusionIndex > -1) {
      autoPlanExclusions.value.splice(exclusionIndex, 1)
    }
  }
}

function toggleExclusion(tag: string) {
  const index = autoPlanExclusions.value.indexOf(tag)
  if (index > -1) {
    autoPlanExclusions.value.splice(index, 1)
  } else {
    autoPlanExclusions.value.push(tag)
    // Remove from preferences if it was there
    const preferenceIndex = autoPlanPreferences.value.indexOf(tag)
    if (preferenceIndex > -1) {
      autoPlanPreferences.value.splice(preferenceIndex, 1)
    }
  }
}

function closeAutoPlanModal() {
  showAutoPlanModal.value = false
  autoPlanLength.value = 7
  autoPlanPreferences.value = []
  autoPlanExclusions.value = []
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
function formatWeekRange(plan: WeeklyPlan): string {
  return `Day 1 - Day ${plan.days.length}`
}

function formatDay(dateString: string, planStartDate: string): string {
  const date = new Date(dateString)
  const startDate = new Date(planStartDate)
  const dayNumber = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return `Day ${dayNumber}`
}

function formatDayShort(dateString: string, planStartDate: string): string {
  const date = new Date(dateString)
  const startDate = new Date(planStartDate)
  const dayNumber = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  return `Day ${dayNumber}`
}

function getRecipeName(recipeId: string): string {
  const recipe = recipes.value.find(r => r.id === recipeId)
  return recipe?.name || t('Unknown recipe')
}
</script>
