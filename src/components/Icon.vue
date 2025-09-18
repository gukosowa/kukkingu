<template>
  <i :class="['relative', cls, icon]" :style="rootStyle" />
</template>

<script lang="ts" setup>
import { computed } from 'vue'

const props = withDefaults(defineProps<{ icon?: string; size?: string; class?: string }>(), {
  size: '3rem',
  icon: '',
  class: '',
})

const cls = computed(() => props.class || '')
const rootStyle = computed(() => ({ fontSize: props.size }))
</script>
