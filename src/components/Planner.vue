<template>
  <div class="flex-grow flex flex-col p-4">
    <div class="mb-4">
      <h1 class="text-2xl font-bold">{{ t('Weekly Planner') }}</h1>
      <p class="text-gray-600 mt-2">{{ t('Plan your meals for the week') }}</p>
    </div>

    <div class="bg-gray-100 rounded-lg p-6 text-center flex-grow">
      <Icon icon="fal fa-calendar-week" size="3rem" class="text-gray-400 mb-4" />
      <h2 class="text-xl font-semibold text-gray-700 mb-2">{{ t('Coming Soon') }}</h2>
      <p class="text-gray-500">{{ t('The weekly planner feature is under development.') }}</p>
    </div>

    <Footer />
  </div>
</template>

<script lang="ts" setup>
import { t } from '~src/i18n'
import Icon from './Icon.vue'
import Footer from './Footer.vue'
</script>
