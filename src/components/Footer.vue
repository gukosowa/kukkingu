<template>
  <ModalConfirm
    v-model:modelValue="showDeleteConfirm"
    :removeName="deleteConfirmName"
    @confirm="clearAll"
    @cancel="cancelClearAll"
  />

  <footer class="z-10 flex-shrink px-2 mt-8 text-gray-500 text-sm flex w-full items-end">
    <div class="h-8 flex items-center w-full">
      <div class="w-full text-xs flex items-baseline">
        <div class="flex-grow flex">
          <div class="flex-grow self-center">
            <a class="" href="/privacy-statement.txt">Privacy Policy</a>
            <div class="mt-1 mb-2 cursor-pointer" @click="initClearAll">
              {{ t('Clear data') }}
            </div>
          </div>

          <div class="flex-shrink">
            <div class="text-sm text-right cursor-pointer" @click="changeLocale">
              <i class="fas fa-globe mr-1" />
              JP
              <i class="fas fa-toggle-on" :class="{ 'fa-rotate-180': currentLocale === 'jp' }" />
              EN
            </div>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import ModalConfirm from '~components/ModalConfirm.vue'
import Icon from './Icon.vue'
import { recipes } from '~src/store/index'
import { currentLocale as _current, defaultLocale, setLocale, t } from '~src/i18n'

const currentLocale = computed(() => _current.value)
let showDeleteConfirm = ref(false)
let deleteConfirmName = ref(t('All recipes'))

onMounted(() => {
  const stored = localStorage.getItem('locale') || defaultLocale
  setLocale(stored as any)
})

function initClearAll() {
  showDeleteConfirm.value = true
}
function clearAll() {
  recipes.value = []
}
function cancelClearAll() {
  showDeleteConfirm.value = false
}
function changeLocale() {
  const set = currentLocale.value === 'jp' ? 'en' : 'jp'
  setLocale(set as any)
}
</script>
