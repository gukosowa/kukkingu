<template>
  <header class="z-10 px-2 text-white h-16 bg-blue-600 fixed flex w-full items-center shadow-md border-b border-blue-700">
    <div class="w-full flex items-baseline">
      <template v-if="!recipe">
        <div class="flex-grow flex">
          <div class="flex-grow self-center">{{ t('材料コンバーター') }}</div>
          <div class="flex-shrink">
            <template v-if="userLoading">
              <Icon icon="fal fa-sync fa-spin mr-4" size="1.2rem" />
            </template>
            <template v-else>
              <Button class="shadow-none" v-if="user" @click="logout()">
                <Icon :icon="didSynced ? 'fal fa-sync fa-spin' : 'fal fa-sign-out'" size="1.2rem" />
              </Button>
              <Button class="shadow-none" v-else @click="loginWithRedirect()">
                <Icon icon="fal fa-cloud-upload" size="1.2rem" />
              </Button>
            </template>
          </div>
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
          :placeholder="t('必要量')"
          type="number"
          @enter="focusNext"
          @update="onchange"
          v-model="recipe.original"
        />
        <Icon class="mx-1" style="top: 3px;" size="1.6rem" icon="fal fa-play-circle" />
        <SInput
          class="w-20"
          :placeholder="t('最低量')"
          type="number"
          id="input-desired"
          ref="elDesire"
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
import { loginWithRedirect, logout } from 'thin-backend'
import { recipes, didSynced as _didSynced } from '~src/store/index'
import { t } from '~src/i18n'
import { user, userLoading } from '~src/services/auth'
import SInput from '~components/Input.vue'
import Icon from './Icon.vue'
import Button from './Button.vue'

const didSynced = computed(() => _didSynced.value)
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
function blurInput(e: any) {
  e.detail?.el?.blur?.()
}
function home() {
  router.push('/')
}
</script>
