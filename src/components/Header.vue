<template>
  <header class="z-10 px-2 text-white h-16 bg-blue-600 fixed flex w-full items-center shadow-md border-b border-blue-700">
    <div class="w-full flex items-baseline">
      <template v-if="!recipe">
        <div class="flex-grow flex items-center">
          <img
            src="/android-chrome-192x192.png"
            alt="Kukkingu"
            class="h-10 w-10 select-none"
            draggable="false"
          />
        </div>
      </template>
      <template v-else>
        <div class="flex-grow">
          <Button class="shadow-none" @click="home">
            <Icon icon="fal fa-arrow-alt-left" size="1.2rem" />
          </Button>
        </div>
      </template>

      <template v-if="recipe">
        <SInput
          class="w-20"
          :placeholder="t('Original amount')"
          type="number"
          :selectOnClick="true"
          @enter="focusNext"
          @update="onchange"
          v-model="recipe.original"
        />
        <Icon class="mx-1" style="top: 3px;" size="1.6rem" icon="fal fa-play-circle cursor-pointer px-1" @click="recipe.desired = recipe.original" />
        <SInput
          class="w-20"
          :placeholder="t('Target amount')"
          type="number"
          id="input-desired"
          ref="elDesire"
          :selectOnClick="true"
          @enter="blurInput"
          @update="onchange"
          v-model="recipe.desired"
        />
      </template>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { recipes } from '~src/store/index'
import { t } from '~src/i18n'
import SInput from '~components/Input.vue'
import Icon from './Icon.vue'
import Button from './Button.vue'

const route = useRoute()
const router = useRouter()

const recipeId = computed(() => {
  if (route.path.startsWith('/recipe/')) {
    const id = route.params.id
    return typeof id === 'string' ? +id : -1
  }
  return -1
})

const recipe = computed<any>({
  get() {
    return recipeId.value !== -1 ? recipes.value[recipeId.value] : null
  },
  set(v) {
    if (recipeId.value !== -1) {
      const copy = [...recipes.value]
      copy[recipeId.value] = v
      recipes.value = copy
    }
  },
})

function onchange() {
  if (recipeId.value !== -1) {
    const copy = [...recipes.value]
    copy[recipeId.value] = recipe.value
    recipes.value = copy
  }
}

const elDesire = ref<any>(null)
function focusNext() {
  elDesire.value?.focus()
}
function blurInput(e: { el: HTMLInputElement | null }) {
  e.el?.blur()
}
function home() {
  // Prefer history back so Vue Router restores saved scroll position
  const canGoBack = typeof window !== 'undefined' && (window.history?.state as any)?.back
  if (canGoBack) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>
