<template>
  <div @click="() => (show = true)" :class="[cls, 'cursor-pointer bg-white focus:ring-indigo-500 text-gray-700 p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md']">
    <div class="whitespace-no-wrap pl-1 text-sm">
      {{ t(modelValue) }}
      <i class="text-gray-500 float-right mt-1 mr-2 fas fa-sort-down" />
    </div>
    <template v-if="show === true">
      <div
        @click.stop="show = false"
        class="fixed z-10 cursor-default top-0 left-0 right-0 bottom-0 opacity-50 bg-black"
      />

      <div class="absolute z-30 justify-end shadow-md mt-3 items bg-gray-300 left-0 right-0 flex flex-row w-full">
        <div class="-mt-2 right-0 absolute mr-4 arrow-up" />
        <div
          v-for="type in types"
          :key="type.value"
          class="text-center cursor-pointer px-5 py-3 bg-white border-l border-r"
          @click.stop="clickType(type)"
        >
          <i :style="{ fontSize: type.size || 'inherit' }" class="text-gray-600 mb-2 block" :class="type.icon" />
          {{ t(type.value) }}
        </div>
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { t } from '~src/i18n'

const props = defineProps<{ modelValue: string; class?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void; (e: 'update', v: string): void }>()
const cls = props.class || ''
let show = ref(false)

const types = [
  { icon: 'fas fa-ellipsis-v', value: '少々' },
  { icon: 'fas fa-weight-hanging', value: 'g' },
  { icon: 'fas fa-tint', value: '㏄' },
  { icon: 'fas fa-utensil-spoon', value: '大さじ' },
  { icon: 'fas fa-utensil-spoon', size: '0.8rem', value: '小さじ' },
  { icon: 'fas fa-circle', value: '個' },
]

function clickType(type: any) {
  emit('update', props.modelValue)
  show.value = false
  emit('update:modelValue', type.value)
}

function focus() {
  show.value = true
}

defineExpose({ focus })
</script>

<style scoped>
  .arrow-up {
    width: 0;
    height: 0;
    border-left: 12px solid transparent;
    border-right: 12px solid transparent;
    border-bottom: 12px solid white;
  }
</style>

