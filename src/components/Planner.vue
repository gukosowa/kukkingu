<template>
  <div class="flex-grow flex flex-col p-4">
    <!-- Header -->
    <div class="mb-6">
      <div class="mb-4">
        <h1 class="text-2xl font-bold">{{ t('Planner') }}</h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button @click="openCreatePlan" class="bg-blue-600 hover:bg-blue-700">
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
    <div v-if="dailyPlans.length === 0" class="bg-gray-50 rounded-lg p-8 text-center flex-grow">
      <Icon icon="fal fa-calendar-week" size="4rem" class="text-gray-300 mb-4" />
      <h3 class="text-lg font-semibold text-gray-700 mb-2">{{ t('No plans yet') }}</h3>
      <p class="text-gray-500 mb-4">{{ t('Create your first meal plan to get started') }}</p>
      <Button @click="openCreatePlan" class="bg-blue-600 hover:bg-blue-700">
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
          </div>
          <Button
            @click="deletePlan(plan.id)"
            class="bg-red-600 hover:bg-red-700 text-white p-2"
            :title="t('Delete')"
          >
            <Icon icon="fal fa-trash" size="0.9rem" />
          </Button>
        </div>

        <div class="space-y-3 mb-4">
          <div
            v-for="(day, dayIndex) in plan.days"
            :key="dayIndex"
            class="text-sm"
          >
            <div class="flex items-start mb-2">
              <span class="text-gray-600 font-medium mr-2 mt-0.5">{{ t('Day') }} {{ dayIndex + 1 }}:</span>
              <div class="flex flex-wrap gap-1 flex-1">
                <template v-for="(recipePlan, recipeIndex) in day.recipes" :key="recipeIndex">
                  <button
                    @click="navigateToRecipe(recipePlan.recipeId)"
                    class="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-sm truncate whitespace-nowrap"
                    :title="getRecipeName(recipePlan.recipeId)"
                  >
                    {{ getRecipeName(recipePlan.recipeId) }}
                  </button>
                  <span
                    v-if="recipeIndex < day.recipes.length - 1"
                    class="text-gray-400 text-sm mx-1"
                  >
                    •
                  </span>
                </template>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button
            @click="openEditPlan(plan)"
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

    <!-- Unified Plan Modal (Create/Edit) -->
    <BaseDialog v-model="showPlanModal" size="xl" dense @close="closePlanModal">
      <template #header>
        <div class="px-4 py-3">
          <div class="text-lg text-gray-600 font-bold">{{ isEditing ? currentPlan?.name : t('Create Plan') }}</div>
        </div>
      </template>

      <template #content>
        <!-- Plan Name Input (only for create mode) -->
        <div v-if="!isEditing" class="mb-4 p-4 bg-gray-50 rounded-lg">
          <div class="max-w-md">
            <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('Plan name') }}</label>
            <Input
              v-model="newPlanName"
              :placeholder="t('Enter plan name')"
              class="w-full"
            />
          </div>
        </div>

        <!-- Days Grid -->
        <div class="bg-gray-200 p-4 rounded-lg">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div
              v-for="(day, index) in modalDays"
              :key="index"
              class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow"
            >
                    <!-- Day Header -->
                    <div class="flex items-center justify-between mb-3">
                      <h4 class="font-medium text-gray-900">{{ t('Day') }} {{ index + 1 }}</h4>
                      <Button
                        v-if="modalDays.length > 1"
                        @click="removeDay(index)"
                        class="bg-red-600 hover:bg-red-700 text-white p-2"
                        :title="t('Remove day')"
                      >
                        <Icon icon="fal fa-trash" size="0.9rem" />
                      </Button>
                    </div>

                    <!-- Recipes List -->
                    <div class="space-y-2">
                      <div
                        v-for="(recipePlan, recipeIndex) in day.recipes"
                        :key="recipePlan.recipeId"
                        class="bg-gray-100 rounded px-3 py-2 text-sm flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        @click="openRecipeDetailsModal(index, recipeIndex)"
                      >
                        <div class="flex-1 min-w-0">
                          <span class="truncate block">{{ getRecipeName(recipePlan.recipeId) }}</span>
                          <span class="text-xs text-gray-500">{{ recipePlan.servings }}x • {{ t(recipePlan.mealType) }}</span>
                        </div>
                        <Button
                          @click.stop="removeRecipeFromDay(index, recipePlan.recipeId)"
                          class="bg-red-600 hover:bg-red-700 text-white p-1 ml-2"
                          :title="t('Remove recipe')"
                        >
                          <Icon icon="fal fa-times" size="0.7rem" />
                        </Button>
                      </div>
                      <div v-if="day.recipes.length === 0" class="text-xs text-gray-400 italic py-2">
                        {{ t('No recipes') }}
                      </div>
                    </div>

                    <!-- Add Recipe Button -->
                    <div class="mt-3">
                      <Button
                        @click="openRecipeSelector(index)"
                        class="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Icon icon="fal fa-plus" size="0.8rem" class="mr-1" />
                        {{ t('Add Recipe') }}
                      </Button>
                    </div>
                  </div>
                </div>

                <!-- Add Entry Button -->
                <div class="flex justify-center">
                  <Button
                    @click="addDay"
                    class="bg-green-600 hover:bg-green-700 text-white px-6"
                  >
                    <Icon icon="fal fa-plus" size="0.9rem" class="mr-2" />
                    {{ t('Add Day') }}
                  </Button>
                </div>
              </div>

      </template>

      <template #footer>
        <div class="px-3 py-2 flex gap-3">
          <button
            class="cursor-pointer py-3 flex-1 bg-gray-500 text-white rounded-lg drop-shadow hover:bg-gray-600 transition-colors"
            @click="closePlanModal"
          >
            {{ t('Cancel') }}
          </button>
          <button
            class="cursor-pointer py-3 flex-1 bg-blue-500 text-white rounded-lg drop-shadow hover:bg-blue-600 transition-colors"
            @click="savePlan"
          >
            {{ isEditing ? t('Save Changes') : t('Create Plan') }}
          </button>
        </div>
      </template>
    </BaseDialog>

    <!-- Auto Plan Modal -->
    <ModalAutoPlan
      v-model="showAutoPlanModal"
      :length="autoPlanLength"
      :preferences="autoPlanPreferences"
      :exclusions="autoPlanExclusions"
      :meal-types="autoPlanMealTypes"
      :all-tags="allTags"
      @update:length="autoPlanLength = $event"
      @update:preferences="autoPlanPreferences = $event"
      @update:exclusions="autoPlanExclusions = $event"
      @update:mealTypes="autoPlanMealTypes = $event"
      @generate="generateAutoPlan"
    />

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

    <!-- Prompt Ready Modal -->
    <ModalPromptReady
      v-model="showPromptReadyModal"
      @goToAI="openImportModal"
    />

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

    <!-- Recipe Selector Modal -->
    <div
      v-if="showRecipeSelector"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg max-w-md w-full">
        <RecipeSelector
          :exclude-recipe-ids="getExistingRecipeIdsForDay(selectedDayIndex)"
          @select="addRecipeToDay"
          @cancel="closeRecipeSelector"
        />
      </div>
    </div>

    <!-- Recipe Details Modal -->
    <div
      v-if="showRecipeDetailsModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <RecipeDetailsModal
        :recipe-name="getRecipeDetailsForEditing().name"
        :initial-servings="getRecipeDetailsForEditing().servings"
        :initial-meal-type="getRecipeDetailsForEditing().mealType"
        @save="saveRecipeDetails"
        @cancel="closeRecipeDetailsModal"
      />
    </div>

    <!-- Shopping List Modal -->
    <ShoppingListModal
      v-model="showShoppingListModal"
      :shopping-list="currentShoppingList"
      :plan-name="currentShoppingListPlan?.name || ''"
      :plan-id="currentShoppingListPlan?.id || ''"
    />


    <Footer />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '~src/i18n'
import { dailyPlans, createWeeklyPlan, updateWeeklyPlan, removeWeeklyPlan, WeeklyPlan, DayPlan, Recipe, getAllTags, getShoppingListForPlan, saveShoppingListForPlan, ShoppingListItem } from '~src/store/index'
import { saveDailyPlan } from '~src/services/indexeddb'
import { generateShoppingList as generateList, generateAutoMealPlanPrompt, importPlanFromJson, parseMealPlanResponse } from '~src/services/planner'
import { recipes } from '~src/store/index'
import Icon from './Icon.vue'
import Footer from './Footer.vue'
import Button from './Button.vue'
import Input from './Input.vue'
import BaseDialog from './BaseDialog.vue'
import ModalInput from './ModalInput.vue'
import ModalPromptReady from './ModalPromptReady.vue'
import ModalConfirm from './ModalConfirm.vue'
import ModalNotice from './ModalNotice.vue'
import ModalAutoPlan from './ModalAutoPlan.vue'
import RecipeSelector from './RecipeSelector.vue'
import RecipeDetailsModal from './RecipeDetailsModal.vue'
import ShoppingListModal from './ShoppingListModal.vue'

const router = useRouter()

// State
const showPlanModal = ref(false)
const showAutoPlanModal = ref(false)
const showPromptReadyModal = ref(false)
const showImportModal = ref(false)
const showDeleteModal = ref(false)
const showNoticeModal = ref(false)
const showShoppingListModal = ref(false)
const noticeMessage = ref('')
const isEditing = ref(false)
const currentPlan = ref<WeeklyPlan | null>(null)
const planToDelete = ref<WeeklyPlan | null>(null)
const newPlanName = ref('')
const modalDays = ref<DayPlan[]>([])
const autoPlanLength = ref(7)
const autoPlanPreferences = ref<string[]>([])
const autoPlanExclusions = ref<string[]>([])
const autoPlanMealTypes = ref<string[]>(['lunch']) // Default to lunch only


// Shopping list state
const currentShoppingList = ref<ShoppingListItem[]>([])
const currentShoppingListPlan = ref<WeeklyPlan | null>(null)

// Recipe selector state
const showRecipeSelector = ref(false)
const selectedDayIndex = ref(-1)

// Recipe details modal state
const showRecipeDetailsModal = ref(false)
const editingRecipeIndex = ref(-1)
const editingDayIndex = ref(-1)

// Computed
const sortedWeeklyPlans = computed(() =>
  [...dailyPlans.value].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
)

const allTags = computed(() => getAllTags())

const canSavePlan = computed(() => {
  if (isEditing.value) return true
  return newPlanName.value.trim() && modalDays.value.length > 0
})

// Functions
function openCreatePlan() {
  isEditing.value = false
  currentPlan.value = null
  newPlanName.value = ''

  // Initialize with 1 day
  modalDays.value = []
  for (let i = 0; i < 1; i++) {
    modalDays.value.push({
      recipes: []
    })
  }

  showPlanModal.value = true
}

function openEditPlan(plan: WeeklyPlan) {
  isEditing.value = true
  currentPlan.value = { ...plan }
  newPlanName.value = plan.name
  modalDays.value = [...plan.days]
  showPlanModal.value = true
}

function addDay() {
  modalDays.value.push({
    recipes: []
  })
}

function removeDay(index: number) {
  if (modalDays.value.length > 1) {
    modalDays.value.splice(index, 1)
  }
}

async function savePlan() {
  try {
    if (isEditing.value && currentPlan.value) {
      // Update existing plan
      currentPlan.value.days = modalDays.value
      currentPlan.value.name = newPlanName.value || currentPlan.value.name
      await updateWeeklyPlan(currentPlan.value)
    } else {
      // Create new plan
      const plan = await createWeeklyPlan(newPlanName.value.trim(), modalDays.value.length)
      plan.days = modalDays.value
      await updateWeeklyPlan(plan)
    }
    closePlanModal()
  } catch (error) {
    console.error('Failed to save plan:', error)
  }
}

function closePlanModal() {
  showPlanModal.value = false
  isEditing.value = false
  currentPlan.value = null
  newPlanName.value = ''
  modalDays.value = []
}

async function generateAutoPlan() {
  if (!autoPlanLength.value || autoPlanLength.value < 1) return

  // Close the current modal
  closeAutoPlanModal()

  try {
    // Generate the prompt
    const options = {
      length: autoPlanLength.value,
      preferences: autoPlanPreferences.value,
      exclusions: autoPlanExclusions.value,
      mealTypes: autoPlanMealTypes.value
    }
    const prompt = generateAutoMealPlanPrompt(options)

    // Copy prompt to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(prompt)
    } else {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = prompt
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }

    // Show prompt ready dialog
    showPromptReadyModal.value = true
  } catch (error) {
    console.error('Failed to generate and copy prompt:', error)
    noticeMessage.value = t('Failed to generate prompt. Please try again.')
    showNoticeModal.value = true
  }
}

async function importPlan(jsonString: string) {
  showImportModal.value = false

  try {
    const plan = importPlanFromJson(jsonString, recipes.value)
    if (plan) {
      // Save to IndexedDB first
      await saveDailyPlan(plan)

      // Check if plan with same ID already exists
      const existingIndex = dailyPlans.value.findIndex(p => p.id === plan.id)
      if (existingIndex !== -1) {
        // Update existing plan
        dailyPlans.value[existingIndex] = plan
      } else {
        // Add new plan
        dailyPlans.value.push(plan)
      }

      // Show success message
      noticeMessage.value = t('Plan imported successfully')
      showNoticeModal.value = true
    } else {
      throw new Error('Failed to parse plan')
    }
  } catch (error) {
    console.error('Failed to import plan:', error)

    // Provide more helpful error messages
    let errorMessage = t('Invalid JSON format')
    if (error instanceof Error) {
      if (error.message.includes('No valid JSON object found')) {
        errorMessage = t('Could not find valid JSON in the pasted text. Please make sure you only copy the JSON part from the AI response.')
      } else if (error.message.includes('Unexpected token')) {
        errorMessage = t('The pasted text contains invalid JSON. Please copy only the JSON object from the AI response.')
      } else if (error.message.includes('no valid recipes')) {
        errorMessage = t('The plan contains recipes that don\'t exist in your recipe collection. Please check the recipe IDs.')
      } else {
        errorMessage = error.message
      }
    }

    noticeMessage.value = errorMessage
    showNoticeModal.value = true
  }
}

async function importAutoGeneratedPlan(llmResponse: string) {
  try {
    const plan = parseMealPlanResponse(llmResponse, recipes.value)
    if (plan) {
      // Save to IndexedDB first
      await saveDailyPlan(plan)

      // Add the plan to the store
      dailyPlans.value.push(plan)

      // Show success message
      noticeMessage.value = t('Auto-generated plan imported successfully!')
      showNoticeModal.value = true

      return plan
    } else {
      throw new Error('Failed to parse auto-generated plan')
    }
  } catch (error) {
    console.error('Failed to import auto-generated plan:', error)

    // Provide more helpful error messages for auto-generated plans
    let errorMessage = t('Failed to parse auto-generated plan')
    if (error instanceof Error) {
      if (error.message.includes('No valid JSON object found')) {
        errorMessage = t('Could not find valid JSON in the AI response. Please make sure the AI provided a proper JSON response.')
      } else if (error.message.includes('Unexpected token')) {
        errorMessage = t('The AI response contains invalid JSON. Please check that the AI followed the requested format.')
      } else if (error.message.includes('no valid recipes')) {
        errorMessage = t('The generated plan contains recipes that don\'t exist. Please regenerate the plan with different preferences.')
      } else {
        errorMessage = error.message
      }
    }

    noticeMessage.value = errorMessage
    showNoticeModal.value = true
    return null
  }
}


async function deletePlan(planId: string) {
  const plan = dailyPlans.value.find(p => p.id === planId)
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

function closeAutoPlanModal() {
  showAutoPlanModal.value = false
  autoPlanLength.value = 7
  autoPlanPreferences.value = []
  autoPlanExclusions.value = []
  autoPlanMealTypes.value = ['lunch'] // Reset to default
}

async function openChatGPT() {
  try {
    // Open ChatGPT in new tab
    window.open('https://chat.openai.com/', '_blank')
  } catch (error) {
    console.error('Failed to open ChatGPT:', error)
  }
}

async function openImportModal() {
  try {
    // Open ChatGPT in new tab
    window.open('https://chat.openai.com/', '_blank')
  } catch (error) {
    console.error('Failed to open ChatGPT:', error)
  }
  // Also open the import modal
  showImportModal.value = true
}

async function generateShoppingList(plan: WeeklyPlan) {
  try {
    // Generate the shopping list
    const generatedList = generateList(plan)

    // Load existing shopping list data for this plan
    const existingList = await getShoppingListForPlan(plan.id)

    // Merge generated list with existing checklist state
    const mergedList = generatedList.map(generatedItem => {
      const existingItem = existingList.find(existing =>
        existing.name.toLowerCase() === generatedItem.name.toLowerCase() &&
        existing.amountType === generatedItem.amountType
      )
      return existingItem ? { ...generatedItem, checked: existingItem.checked } : generatedItem
    })

    // Update state
    currentShoppingList.value = mergedList
    currentShoppingListPlan.value = plan

    // Save the merged list
    await saveShoppingListForPlan(plan.id, mergedList)

    // Show the modal
    showShoppingListModal.value = true
  } catch (error) {
    console.error('Failed to generate shopping list:', error)
    noticeMessage.value = t('Failed to generate shopping list')
    showNoticeModal.value = true
  }
}

// Helper functions
function formatWeekRange(plan: WeeklyPlan): string {
  return `Day 1 - Day ${plan.days.length}`
}

function getRecipeName(recipeId: string): string {
  const recipe = recipes.value.find(r => r.id === recipeId)
  return recipe?.name || t('Unknown recipe')
}

function openRecipeSelector(dayIndex: number) {
  selectedDayIndex.value = dayIndex
  showRecipeSelector.value = true
}

function closeRecipeSelector() {
  showRecipeSelector.value = false
  selectedDayIndex.value = -1
}

function addRecipeToDay(recipe: Recipe) {
  if (selectedDayIndex.value === -1 || !recipe.id) return

  // Default to lunch, but could be enhanced with a meal type selector
  const defaultMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'lunch'

  modalDays.value[selectedDayIndex.value].recipes.push({
    recipeId: recipe.id,
    servings: 2, // Default servings
    mealType: defaultMealType
  })

  closeRecipeSelector()
}

function removeRecipeFromDay(dayIndex: number, recipeId: string) {
  const day = modalDays.value[dayIndex]
  if (day) {
    day.recipes = day.recipes.filter(recipe => recipe.recipeId !== recipeId)
  }
}

function getExistingRecipeIdsForDay(dayIndex: number): string[] {
  if (dayIndex === -1 || !modalDays.value[dayIndex]) return []
  return modalDays.value[dayIndex].recipes.map(recipe => recipe.recipeId)
}

function openRecipeDetailsModal(dayIndex: number, recipeIndex: number) {
  editingDayIndex.value = dayIndex
  editingRecipeIndex.value = recipeIndex
  showRecipeDetailsModal.value = true
}

function closeRecipeDetailsModal() {
  showRecipeDetailsModal.value = false
  editingDayIndex.value = -1
  editingRecipeIndex.value = -1
}

function saveRecipeDetails(data: { servings: number; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' }) {
  if (editingDayIndex.value === -1 || editingRecipeIndex.value === -1) return

  const recipePlan = modalDays.value[editingDayIndex.value].recipes[editingRecipeIndex.value]
  if (recipePlan) {
    recipePlan.servings = data.servings
    recipePlan.mealType = data.mealType
  }

  closeRecipeDetailsModal()
}

function getRecipeDetailsForEditing(): { name: string; servings: number; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' } {
  if (editingDayIndex.value === -1 || editingRecipeIndex.value === -1) {
    return { name: '', servings: 2, mealType: 'lunch' }
  }

  const recipePlan = modalDays.value[editingDayIndex.value].recipes[editingRecipeIndex.value]
  if (!recipePlan) {
    return { name: '', servings: 2, mealType: 'lunch' }
  }

  return {
    name: getRecipeName(recipePlan.recipeId),
    servings: recipePlan.servings,
    mealType: recipePlan.mealType
  }
}

function navigateToRecipe(recipeId: string): void {
  router.push(`/recipe/${recipeId}`)
}
</script>

<style scoped>
.drop-shadow {
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))
    drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
}
</style>
