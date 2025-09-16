<template>
  <BaseDialog v-model="showModal" size="lg" @close="close">
    <template #header>
      <div class="px-4 py-3">
        <div class="text-lg text-gray-600 font-bold">{{ t('Generate Auto Meal Plan') }}</div>
      </div>
    </template>

    <template #content>
      <div class="space-y-6">
        <!-- Length Input -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('Plan Length (Days)') }}</label>
          <Input
            v-model.number="localLength"
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
                  'px-3 py-1 text-sm rounded-full border transition-colors whitespace-nowrap',
                  localPreferences.includes(tag)
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
                  'px-3 py-1 text-sm rounded-full border transition-colors whitespace-nowrap',
                  localExclusions.includes(tag)
                    ? 'bg-red-100 border-red-300 text-red-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                ]"
              >
                {{ tag }}
              </button>
            </div>
          </div>
        </div>

        <!-- Meal Type Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-3">{{ t('Meal Types') }}</label>
          <p class="text-xs text-gray-500 mb-4">{{ t('Select which meals to include in the plan') }}</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="meal in mealTypes"
              :key="meal.id"
              @click="toggleMealType(meal.id)"
              :class="[
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                localMealTypes.includes(meal.id)
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
            >
              {{ t(meal.label) }}
            </button>
          </div>
        </div>

        <!-- Plan Details Summary -->
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-medium text-gray-900 mb-2">{{ t('Plan Details') }}</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span class="text-gray-500">{{ t('Days') }}:</span>
              <span class="ml-2 font-medium">{{ localLength }}</span>
            </div>
            <div>
              <span class="text-gray-500">{{ t('Recipes Available') }}:</span>
              <span class="ml-2 font-medium">{{ recipeCount }}</span>
            </div>
            <div>
              <span class="text-gray-500">{{ t('Preferred Tags') }}:</span>
              <span class="ml-2 font-medium">{{ localPreferences.length }}</span>
            </div>
            <div>
              <span class="text-gray-500">{{ t('Excluded Tags') }}:</span>
              <span class="ml-2 font-medium">{{ localExclusions.length }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="px-3 py-2 flex gap-3">
        <button
          class="cursor-pointer py-3 flex-1 bg-gray-500 text-white rounded-lg drop-shadow hover:bg-gray-600 transition-colors"
          @click="close"
        >
          {{ t('Cancel') }}
        </button>
        <button
          class="cursor-pointer py-3 flex-1 bg-green-500 text-white rounded-lg drop-shadow hover:bg-green-600 transition-colors"
          :class="{ 'opacity-50 cursor-not-allowed': !localLength || localLength < 1 }"
          :disabled="!localLength || localLength < 1"
          @click="generate"
        >
          {{ t('Generate') }}
        </button>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { t } from '~src/i18n'
import { recipes } from '~src/store/index'
import BaseDialog from './BaseDialog.vue'
import Input from './Input.vue'

interface Props {
  modelValue: boolean
  length: number
  preferences: string[]
  exclusions: string[]
  mealTypes?: string[]
  allTags: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:length': [value: number]
  'update:preferences': [value: string[]]
  'update:exclusions': [value: string[]]
  'update:mealTypes': [value: string[]]
  'generate': []
}>()

// Meal types configuration
const mealTypes = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' }
]

// Local reactive state
const localLength = ref(props.length)
const localPreferences = ref([...props.preferences])
const localExclusions = ref([...props.exclusions])
const localMealTypes = ref([...(props.mealTypes || ['lunch'])])

// Flag to prevent recursive updates
const updatingFromParent = ref(false)
const updatingFromLocal = ref(false)

// Count available recipes
const recipeCount = computed(() => {
  return recipes.value.filter(recipe => recipe.id && recipe.ingredients.length > 0).length
})

// Computed modal visibility
const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Watch for prop changes and update local state
watch(() => props.length, (newLength) => {
  if (!updatingFromLocal.value) {
    updatingFromParent.value = true
    localLength.value = newLength
    updatingFromParent.value = false
  }
})

watch(() => props.preferences, (newPreferences) => {
  if (!updatingFromLocal.value) {
    updatingFromParent.value = true
    localPreferences.value = [...newPreferences]
    updatingFromParent.value = false
  }
}, { deep: true })

watch(() => props.exclusions, (newExclusions) => {
  if (!updatingFromLocal.value) {
    updatingFromParent.value = true
    localExclusions.value = [...newExclusions]
    updatingFromParent.value = false
  }
}, { deep: true })

watch(() => props.mealTypes, (newMealTypes) => {
  if (!updatingFromLocal.value) {
    updatingFromParent.value = true
    localMealTypes.value = [...(newMealTypes || ['lunch'])]
    updatingFromParent.value = false
  }
}, { deep: true })

// Watch local changes and emit updates
watch(localLength, (newLength) => {
  if (!updatingFromParent.value) {
    emit('update:length', newLength)
  }
})

// Helper functions
function togglePreference(tag: string) {
  updatingFromLocal.value = true

  const index = localPreferences.value.indexOf(tag)
  if (index > -1) {
    localPreferences.value.splice(index, 1)
  } else {
    localPreferences.value.push(tag)
    // Remove from exclusions if it was there
    const exclusionIndex = localExclusions.value.indexOf(tag)
    if (exclusionIndex > -1) {
      localExclusions.value.splice(exclusionIndex, 1)
    }
  }

  // Emit updates after all modifications are complete
  nextTick(() => {
    emit('update:preferences', [...localPreferences.value])
    emit('update:exclusions', [...localExclusions.value])
    updatingFromLocal.value = false
  })
}

function toggleExclusion(tag: string) {
  updatingFromLocal.value = true

  const index = localExclusions.value.indexOf(tag)
  if (index > -1) {
    localExclusions.value.splice(index, 1)
  } else {
    localExclusions.value.push(tag)
    // Remove from preferences if it was there
    const preferenceIndex = localPreferences.value.indexOf(tag)
    if (preferenceIndex > -1) {
      localPreferences.value.splice(preferenceIndex, 1)
    }
  }

  // Emit updates after all modifications are complete
  nextTick(() => {
    emit('update:preferences', [...localPreferences.value])
    emit('update:exclusions', [...localExclusions.value])
    updatingFromLocal.value = false
  })
}

function generate() {
  emit('generate')
}

function toggleMealType(mealType: string) {
  updatingFromLocal.value = true

  const index = localMealTypes.value.indexOf(mealType)
  if (index > -1) {
    // Allow removing any meal type, including the last one
    localMealTypes.value.splice(index, 1)
  } else {
    localMealTypes.value.push(mealType)
  }

  // Emit updates after all modifications are complete
  nextTick(() => {
    emit('update:mealTypes', [...localMealTypes.value])
    updatingFromLocal.value = false
  })
}

function close() {
  showModal.value = false
}
</script>
