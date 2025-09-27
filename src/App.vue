<template>
  <div class="App h-[100dvh] flex flex-col">
    <Header />
    <div class='w-full min-h-16'></div>
    <div class="bg-gray-200 flex-grow flex flex-col p-2 font-sans">
      <RouterView />
    </div>

    <!-- View Mode chip -->
    <div
      v-if="isViewingFriend"
      class="fixed bottom-3 left-3 z-50"
    >
      <div class="flex items-center gap-2 bg-orange-600 text-white px-3 py-1.5 rounded-full shadow-lg">
        <span class="text-sm font-medium">View Mode</span>
        <button
          type="button"
          class="text-white/90 hover:text-white focus:outline-none"
          aria-label="Exit view mode"
          title="Exit view mode"
          @click="handleExitViewMode"
        >
          ×
        </button>
      </div>
    </div>
  </div>

</template>

<script lang="ts" setup>
import Header from '~components/Header.vue'
import { isViewingFriend, exitViewMode } from '~src/services/viewMode'
import { useRouter } from 'vue-router'

const router = useRouter()

function handleExitViewMode() {
  exitViewMode()
  // Ensure the app routes to Storage where IDB data is available
  router.push('/')
}
</script>

<style scoped>
</style>

