<template>
  <div class="bg-white border border-gray-200 rounded-lg p-4 max-h-96 flex flex-col">
    <!-- Header with search -->
    <div class="mb-3">
      <h3 class="font-medium text-gray-900 mb-2">{{ t('Select Recipe') }}</h3>
      <SInput
        v-model="searchQuery"
        :placeholder="t('Search recipes...')"
        class="w-full"
      >
        <template #prefix>
          <Icon icon="fal fa-search" size="0.9rem" class="text-gray-400" />
        </template>
      </SInput>
    </div>

    <!-- Recipe list -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="filteredRecipes.length === 0" class="text-center py-8 text-gray-500">
        <Icon icon="fal fa-search" size="2rem" class="text-gray-300 mb-2" />
        <p>{{ searchQuery ? t('No recipes found') : t('No recipes available') }}</p>
      </div>

      <div v-else class="space-y-1">
        <button
          v-for="recipe in filteredRecipes"
          :key="recipe.id"
          @click="selectRecipe(recipe)"
          class="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
        >
          <div class="font-medium text-gray-900">{{ recipe.name }}</div>
          <div class="text-sm text-gray-500 mt-1">
            {{ recipe.ingredients.length }} {{ t('ingredients') }}
            <span v-if="recipe.tags && recipe.tags.length > 0" class="ml-2">
              • {{ recipe.tags.slice(0, 3).join(', ') }}
            </span>
          </div>
        </button>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-3 pt-3 border-t border-gray-200">
      <Button @click="$emit('cancel')" class="w-full bg-gray-500 hover:bg-gray-600">
        {{ t('Cancel') }}
      </Button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { t } from '~src/i18n'
import { recipes, Recipe } from '~src/store/index'
import Icon from './Icon.vue'
import Button from './Button.vue'
import SInput from './Input.vue'

interface Props {
  excludeRecipeIds?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  excludeRecipeIds: () => []
})

const emit = defineEmits<{
  select: [recipe: Recipe]
  cancel: []
}>()

const searchQuery = ref('')

const filteredRecipes = computed(() => {
  let filtered = recipes.value.filter(recipe =>
    recipe.id && !props.excludeRecipeIds.includes(recipe.id)
  )

  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(recipe =>
      recipe.name.toLowerCase().includes(query) ||
      (recipe.tags && recipe.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }

  // Sort by name
  return filtered.sort((a, b) => a.name.localeCompare(b.name))
})

function selectRecipe(recipe: Recipe) {
  emit('select', recipe)
}
</script>
