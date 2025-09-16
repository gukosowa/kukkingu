<template>
  <div class="bg-white rounded-lg p-6 max-w-md w-full">
    <!-- Header -->
    <div class="mb-4">
      <h3 class="text-lg font-semibold text-gray-900">{{ t('Edit Recipe') }}</h3>
      <p class="text-sm text-gray-600 mt-1">{{ recipeName }}</p>
    </div>

    <!-- Form -->
    <div class="space-y-4">
      <!-- Meal Type -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('Meal Type') }}</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            v-for="mealType in mealTypes"
            :key="mealType.value"
            @click="selectedMealType = mealType.value"
            :class="[
              'px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
              selectedMealType === mealType.value
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
            ]"
          >
            {{ mealType.label }}
          </button>
        </div>
      </div>

      <!-- Servings -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('Servings') }}</label>
        <SInput
          v-model.number="selectedServings"
          type="number"
          :min="1"
          :max="20"
          class="w-full"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-6 flex gap-3">
      <Button
        @click="$emit('cancel')"
        class="flex-1 bg-gray-500 hover:bg-gray-600 text-white"
      >
        {{ t('Cancel') }}
      </Button>
      <Button
        @click="$emit('save', { servings: selectedServings, mealType: selectedMealType })"
        class="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
      >
        {{ t('Save') }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { t } from '~src/i18n'
import Button from './Button.vue'
import SInput from './Input.vue'

interface Props {
  recipeName: string
  initialServings: number
  initialMealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  save: [data: { servings: number; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' }]
  cancel: []
}>()

const selectedServings = ref(props.initialServings)
const selectedMealType = ref(props.initialMealType)

const mealTypes = [
  { value: 'breakfast' as const, label: t('Breakfast') },
  { value: 'lunch' as const, label: t('Lunch') },
  { value: 'dinner' as const, label: t('Dinner') },
  { value: 'snack' as const, label: t('Snack') }
]

// Reset values when props change
watch(() => props.initialServings, (newVal) => {
  selectedServings.value = newVal
})

watch(() => props.initialMealType, (newVal) => {
  selectedMealType.value = newVal
})
</script>
