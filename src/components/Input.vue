<template>
  <div class="flex items-baseline" :class="cls">
    <Icon v-if="icon" :icon="icon" class="mr-1" style="top: 3px;" size="1.6rem" />
    <label style="width: 100%">
      <input
        :type="type"
        :placeholder="placeholder"
        :value="modelValue as any"
        :id="id || undefined"
        ref="el"
        @input="handleInput"
        @keypress="onKeyPress"
        :disabled="!!disabled"
        class="w-full focus:ring-indigo-500 text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md"
        :class="inputClass"
      />
    </label>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import Icon from './Icon.vue'

const props = withDefaults(
  defineProps<{
    type?: string
    inputClass?: string
    modelValue?: any
    icon?: string
    disabled?: boolean
    placeholder?: string
    autofocus?: boolean
    id?: string | null
    class?: string
  }>(),
  { type: 'text', inputClass: '', modelValue: '', icon: '', disabled: false, placeholder: '', autofocus: false, id: null, class: '' }
)
const emit = defineEmits<{
  (e: 'update:modelValue', v: any): void
  (e: 'input', v: any): void
  (e: 'update', v: any): void
  (e: 'enter', payload: { value: any; el: HTMLInputElement | null }): void
}>()

const el = ref<HTMLInputElement | null>(null)
const cls = props.class || ''

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  const val = props.type?.match(/^(number|range)$/) ? +target.value : target.value
  emit('update:modelValue', val)
  emit('input', val)
  emit('update', val)
}

const onKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') emit('enter', { value: props.modelValue, el: el.value })
}

onMounted(() => {
  if (props.autofocus) {
    el.value?.focus()
  }
})

defineExpose({ focus: () => el.value?.focus(), elInput: el })
</script>

