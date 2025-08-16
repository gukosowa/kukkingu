<template>
  <div :class="cls">
    <div
      v-if="modelValue"
      @click="toggle"
      class="w-10 h-10 bg-blue-600 border-2 border-blue-400 block text-center rounded-lg"
    >
      <i class="fas fa-check text-md" />
    </div>
    <div
      v-else
      @click="toggle"
      class="w-10 h-10 bg-white border-2 border-blue-400 block rounded-lg"
    />
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{ modelValue: boolean; class?: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'input', v: boolean): void }>()
const cls = props.class || ''
const toggle = () => {
  emit('update:modelValue', !props.modelValue)
  emit('input', !props.modelValue)
}
</script>

<style scoped>
div {
  cursor: pointer;
}
</style>

