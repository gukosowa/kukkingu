<template>
  <BaseDialog v-model="showModal" size="lg" @close="close">
    <template #header>
      <div class="px-4 py-3">
        <div class="text-lg text-gray-700 font-bold">{{ t('Import Preview') }}</div>
      </div>
    </template>

    <template #content>
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
              <div class="text-sm space-y-2">
                <!-- Detailed changes with color highlighting -->
                <div v-if="update.detailedChanges && update.detailedChanges.length > 0">
                  <div v-for="detailedChange in update.detailedChanges" :key="detailedChange.description" class="space-y-1">
                    <div class="font-medium text-blue-800">{{ detailedChange.description }}:</div>
                    <div class="ml-4 flex flex-wrap items-center whitespace-pre-wrap">
                      <span
                        v-for="(part, index) in detailedChange.parts"
                        :key="index"
                        :class="[
                          'px-1 rounded text-xs font-mono',
                          part.type === 'removed' ? 'bg-red-100 text-red-800' : '',
                          part.type === 'added' ? 'bg-green-100 text-green-800' : '',
                          part.type === 'unchanged' ? 'text-gray-600' : ''
                        ]"
                      >
                        {{ part.text }}
                      </span>
                    </div>
                  </div>
                </div>
                <!-- Fallback to simple text changes if detailed changes not available -->
                <div v-else class="text-blue-800 space-y-1">
                  <div v-for="change in update.changes" :key="change" class="flex">
                    <span class="mr-2">•</span>
                    <span>{{ change }}</span>
                  </div>
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
      </div>
    </template>

    <template #footer>
      <div class="px-3 py-2 flex flex-col gap-2">
        <!-- Cancel button on first row -->
        <div class="flex">
          <Button
            @click="handleCancel"
            color="gray"
            class="flex-1"
          >
            {{ t('Cancel') }}
          </Button>
        </div>
        <!-- Update and Add buttons on second row -->
        <div v-if="diff.updates.length > 0 || diff.creates.length > 0" class="flex gap-2">
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
        </div>
      </div>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { t } from '~src/i18n'
import Button from './Button.vue'
import BaseDialog from './BaseDialog.vue'
import type { ImportDiff, DetailedChange } from '~src/services/importExport'

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
  showModal.value = false
}
</script>

