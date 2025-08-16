<template>
  <div class="App h-screen flex flex-col">
    <Header />
    <div class="mt-16 bg-gray-200 flex-grow flex flex-col p-2">
      <RouterView />
    </div>
  </div>
  
</template>

<script lang="ts" setup>
import Header from '~components/Header.vue'
</script>

<style scoped>
</style>

