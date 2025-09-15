<template>
  <div v-if="showModal">
    <!-- Backdrop -->
    <div class="fixed w-screen h-screen bg-black top-0 left-0 z-40 opacity-50" />

    <!-- Modal -->
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
        v-if="showModal"
        class="fixed w-screen h-screen top-0 left-0 z-50 overflow-y-auto"
        style="backdrop-filter: blur(1px)"
        @click="close"
      >
        <div class="w-full min-h-full px-12 py-8 flex flex-col transform">
          <div class="bg-white p-5 rounded-xl drop-shadow max-w-2xl mx-auto" @click.stop>
            <!-- Header -->
            <div class="flex items-start mb-4">
              <div class="flex-1">
                <div class="text-lg text-gray-700 font-bold">{{ t('Import Preview') }}</div>
              </div>
            </div>

            <!-- Content -->
            <div class="space-y-4">
              <!-- Summary -->
              <div class="text-sm text-gray-600">
                <p v-if="diff.updates.length > 0" class="mb-2">
                  {{ t('Will update') }} {{ diff.updates.length }} {{ diff.updates.length === 1 ? t('recipe') : t('recipes') }}
                </p>
                <p v-if="diff.creates.length > 0" class="mb-2">
                  {{ t('Will create') }} {{ diff.creates.length }} {{ diff.creates.length === 1 ? t('recipe') : t('recipes') }}
                </p>
                <p v-if="diff.updates.length === 0 && diff.creates.length === 0" class="text-center">
                  {{ t('No changes detected') }}
                </p>
              </div>

              <!-- Updates Section -->
              <div v-if="diff.updates.length > 0" class="border-t pt-4">
                <h3 class="text-lg font-medium text-gray-900 mb-3">{{ t('Recipes to Update') }}</h3>
                <div class="space-y-3 max-h-60 overflow-y-auto">
                  <div
                    v-for="(update, index) in diff.updates"
                    :key="index"
                    class="border rounded-lg p-3 bg-blue-50"
                  >
                    <div class="font-medium text-blue-900 mb-2">
                      {{ update.existing.name }}
                    </div>
                    <div class="text-sm text-blue-800 space-y-1">
                      <div v-for="change in update.changes" :key="change" class="flex">
                        <span class="mr-2">•</span>
                        <span>{{ change }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Creates Section -->
              <div v-if="diff.creates.length > 0" class="border-t pt-4">
                <h3 class="text-lg font-medium text-gray-900 mb-3">{{ t('Recipes to Create') }}</h3>
                <div class="space-y-2 max-h-40 overflow-y-auto">
                  <div
                    v-for="(recipe, index) in diff.creates"
                    :key="index"
                    class="border rounded-lg p-3 bg-green-50"
                  >
                    <div class="font-medium text-green-900">
                      {{ recipe.name }}
                    </div>
                    <div v-if="recipe.note" class="text-sm text-green-700 mt-1">
                      {{ recipe.note }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2 pt-4 border-t">
                <Button
                  v-if="diff.updates.length > 0"
                  @click="handleUpdate"
                  color="blue"
                  class="flex-1"
                >
                  {{ t('Update Existing') }}
                </Button>
                <Button
                  v-if="diff.creates.length > 0"
                  @click="handleCreateNew"
                  color="green"
                  class="flex-1"
                >
                  {{ t('Create New') }}
                </Button>
                <Button
                  @click="handleAddAsNew"
                  color="pink"
                  class="flex-1"
                >
                  {{ t('Add as New') }}
                </Button>
                <Button
                  @click="handleCancel"
                  color="gray"
                  class="flex-1"
                >
                  {{ t('Cancel') }}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '~src/i18n'
import Button from './Button.vue'
import { vibrate } from '~src/services/vibrate'
import type { ImportDiff } from '~src/services/importExport'

interface Props {
  modelValue: boolean
  diff: ImportDiff
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'update-existing'): void
  (e: 'create-new'): void
  (e: 'add-as-new'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const showModal = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

function handleUpdate() {
  emit('update-existing')
  showModal.value = false
}

function handleCreateNew() {
  emit('create-new')
  showModal.value = false
}

function handleAddAsNew() {
  emit('add-as-new')
  showModal.value = false
}

function handleCancel() {
  emit('cancel')
  showModal.value = false
}

function close() {
  vibrate()
  showModal.value = false
}
</script>

<style scoped>
.drop-shadow {
  filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1)) drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
}
</style>
