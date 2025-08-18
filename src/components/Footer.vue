<template>
  <ModalConfirm
    v-model:modelValue="showDeleteConfirm"
    :removeName="deleteConfirmName"
    @confirm="clearAll"
    @cancel="cancelClearAll"
  />
  <ModalLocale
    v-model:modelValue="showLocaleModal"
    :locale="currentLocale"
    @confirm="confirmLocale"
  />

  <footer class="z-10 flex-shrink px-2 mt-8 text-gray-500 text-sm flex w-full items-end">
    <div class="h-8 flex items-center w-full">
      <div class="w-full text-xs flex items-baseline">
        <div class="flex-grow flex">
          <div class="flex-grow self-center">
            <a class="" href="/privacy-statement.txt">{{ t('Privacy Policy') }}</a>
            <div class="mt-1 mb-2 cursor-pointer" @click="initClearAll">
              {{ t('Clear data') }}
            </div>
          </div>

          <div class="flex-shrink">
            <div class="text-sm text-right cursor-pointer" @click="openLocaleModal">
              <i class="fas fa-globe mr-1" />
              {{ currentLocale.toUpperCase() }}
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
import ModalLocale from '~components/ModalLocale.vue'
import { recipes } from '~src/store/index'
import { currentLocale as _current, defaultLocale, setLocale, t } from '~src/i18n'

const currentLocale = computed(() => _current.value)
let showDeleteConfirm = ref(false)
let deleteConfirmName = ref(t('All recipes'))
let showLocaleModal = ref(false)

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
function openLocaleModal() {
  showLocaleModal.value = true
}
function confirmLocale(locale: string) {
  setLocale(locale as any)
  showLocaleModal.value = false
}
</script>
