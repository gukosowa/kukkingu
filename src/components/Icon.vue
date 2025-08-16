<template>
  <i :class="['relative', cls, icon]" :style="cstyles" />
  
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = defineProps<{ icon?: string; size?: string; class?: string; style?: string }>()

const cls = computed(() => props.class || '')
const cstyles = computed(() => {
  const size = props.size ?? '3rem'
  const styles: Record<string, string> = { 'font-size': size }
  const base = Object.entries(styles)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
  return `${base}; ${props.style ?? ''}`
})
</script>

