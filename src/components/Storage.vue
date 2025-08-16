<template>
  <div class="flex-grow flex flex-col">
    <ModalConfirm
      v-model:modelValue="showDeleteConfirm"
      :removeName="deleteConfirmName"
      @confirm="remove"
      @cancel="cancelRemove"
    />
    <div class="text-left mb-2 flex items-baseline">
      <SInput
        class="flex-1 mx-2"
        v-model="recipeName"
        @enter="onCreateNew"
        :placeholder="t('レシピ名')"
      />
      <Button class="ml-2 flex-shrink" @click="onCreateNew">{{ t('作成') }}</Button>
    </div>

    <div v-for="(item, index) in recipes" :key="index">
      <div class="flex items-baseline rounded-xl bg-gray-300 px-2 py-2 my-1">
        <div class="flex-grow pr-2">
          <template v-if="item.rename">
            <SInput
              @enter="() => rename(index)"
              :autofocus="true"
              :modelValue="item.name"
              @update="(v:any) => changeName(v, index)"
            />
          </template>
          <template v-else>
            <Button color="pink" @click="open(index)" class="font-hairline text-lg leading-5 tracking-wider">
              {{ item.name }}
            </Button>
          </template>
        </div>
        <div class="flex-grow whitespace-no-wrap text-right">
          <template v-if="item.rename">
            <i @click="moveDown(index)" class="text-sm cursor-pointer fal fa-arrow-down p-2 text-gray-600" />
            <i @click="moveUp(index)" class="text-sm cursor-pointer fal fa-arrow-up p-2 text-gray-600" />
            <Button color="red" class="mr-1" :tone="300" @click="() => initRemove(index, item.name)">
              <Icon icon="fal fa-trash-alt" size="1.2rem" />
            </Button>
            <Button color="green" :tone="400" @click="() => rename(index)">
              <Icon icon="fal fa-check" size="1.2rem" />
            </Button>
          </template>
          <template v-else>
            <Button color="gray" :tone="400" @click="() => initRename(index)">
              <Icon icon="fal fa-pen" size="1.2rem" />
            </Button>
          </template>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '~src/i18n'
import Footer from '~components/Footer.vue'
import { recipes as _recipes } from '~src/store/index'
import Button from './Button.vue'
import SInput from './Input.vue'
import { newRecipe } from '~plugins/helper'
import Icon from './Icon.vue'
import ModalConfirm from './ModalConfirm.vue'

const router = useRouter()
const recipes = computed({ get: () => _recipes.value, set: (v) => (_recipes.value = v as any) })
let recipeName = ref('')
let showDeleteConfirm = ref(false)
let deleteConfirmName = ref('')
let deleteIndex = ref<number | null>(null)

function onCreateNew() {
  _recipes.value = newRecipe(recipeName.value)
  recipeName.value = ''
}
function open(index: number) {
  router.push('/recipe/' + index)
}
function initRename(index: number) {
  const copy = [...recipes.value]
  ;(copy[index] as any).rename = true
  recipes.value = copy
}
function changeName(value: any, index: number) {
  const copy = [...recipes.value]
  ;(copy[index] as any).name = value || ''
  recipes.value = copy
}
function rename(index: number) {
  const copy = [...recipes.value]
  if (!(copy[index] as any).name) {
    ;(copy[index] as any).name = '-'
  }
  delete (copy[index] as any).rename
  recipes.value = copy
}
function initRemove(index: number, removeName: string) {
  showDeleteConfirm.value = true
  deleteConfirmName.value = removeName
  deleteIndex.value = index
}
function cancelRemove() {
  showDeleteConfirm.value = false
  deleteIndex.value = null
}
function remove() {
  if (deleteIndex.value == null) return
  const copy = recipes.value.filter((_, i) => i !== deleteIndex.value)
  recipes.value = copy
  cancelRemove()
}
function array_move<T>(array: T[], sourceIndex: number, destinationIndex: number): T[] {
  const smallerIndex = Math.min(sourceIndex, destinationIndex)
  const largerIndex = Math.max(sourceIndex, destinationIndex)

  return [
    ...array.slice(0, smallerIndex),
    ...(sourceIndex < destinationIndex ? array.slice(smallerIndex + 1, largerIndex + 1) : []),
    array[sourceIndex],
    ...(sourceIndex > destinationIndex ? array.slice(smallerIndex, largerIndex) : []),
    ...array.slice(largerIndex + 1),
  ]
}
function moveUp(index: number) {
  const clamp = Math.max(0, index - 1)
  recipes.value = array_move(recipes.value as any, index, clamp) as any
}
function moveDown(index: number) {
  const clamp = Math.min(recipes.value.length - 1, index + 1)
  recipes.value = array_move(recipes.value as any, index, clamp) as any
}
</script>
