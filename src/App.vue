<template>
  <div class="App h-[100dvh] flex flex-col">
    <Header />
    <div class='w-full min-h-16'></div>
    <div class="bg-gray-200 flex-grow flex flex-col p-2 font-sans">
      <RouterView />
    </div>
  </div>

</template>

<script lang="ts" setup>
import Header from '~components/Header.vue'
</script>

<style scoped>
</style>

