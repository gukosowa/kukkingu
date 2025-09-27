<template>
  <div class="App h-[100dvh] flex flex-col">
    <Header />
    <div class='w-full min-h-16'></div>
    <div class="bg-gray-200 flex-grow flex flex-col p-2 font-sans">
      <RouterView />
    </div>

    <!-- View Mode chip -->
    <Transition name="chip" appear v-if="isViewingFriend">
      <div class="fixed bottom-3 left-3 z-50">
        <div class="flex items-center gap-2 bg-orange-600/60 backdrop-blur text-white px-3 py-1.5 rounded-full shadow-lg">
          <span class="text-sm font-medium">{{ t('Friend view') }}</span>
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
    </Transition>
  </div>

</template>

<script lang="ts" setup>
import Header from '~components/Header.vue'
import { isViewingFriend, exitViewMode } from '~src/services/viewMode'
import { t } from '~src/i18n'
import { useRouter } from 'vue-router'

const router = useRouter()

function handleExitViewMode() {
  exitViewMode()
  // Ensure the app routes to Storage where IDB data is available
  router.push('/')
}
</script>

<style scoped>
/***** View Mode chip transition *****/
.chip-enter-from,
.chip-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

.chip-enter-active,
.chip-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.chip-enter-to,
.chip-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>

