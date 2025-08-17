<template>
  <div v-if="recipe" class='flex-grow flex flex-col'>
    <div class="flex items-center my-1">
      <div class="title flex-1 whitespace-nowrap overflow-hidden text-xs px-1 font-bold text-gray-700">
        {{ recipe?.name }}
      </div>

      <template v-if="!recipe.checklist">
        <Button @click="switchEdit" class="mr-1" color="green">
          <template v-if="recipe.edit">
            <Icon icon="fal fa-eye" class="mr-1" size="0.8rem" />
            {{ t('View mode') }}
          </template>
          <template v-else>
            <Icon icon="fal fa-pen" class="mr-1" size="0.8rem" />
            {{ t('Edit mode') }}
          </template>
        </Button>
      </template>
      <template v-else>
        <Button @click="clearCheck" class="mr-1" color="gray">
          <Icon icon="fal fa-broom" class="mr-1" size="0.8rem" />
          {{ t('Clear') }}
        </Button>
      </template>
      <template v-if="!recipe.edit">
        <Button @click="switchCheck" color="gray">
          <template v-if="recipe.checklist">
            <Icon icon="fal fa-eye" class="mr-1" size="0.8rem" />
            {{ t('View mode') }}
          </template>
          <template v-else>
            <Icon icon="fal fa-shopping-cart" class="mr-1" size="0.8rem" />
            {{ t('Checklist') }}
          </template>
        </Button>
      </template>
    </div>
    <div class="flex flex-col flex-grow">
      <div class="mb-3 mt-2">
        <div class="grid grid-cols-12 mb-3 gap-1" v-for="(item, index) in recipe.ingredients" :key="index">
          <template v-if="recipe.edit">
            <SInput
              :placeholder="t('Ingredient')"
              class="col-span-6"
              inputClass="input-field"
              :id="'input-name-' + index"
              @enter="() => focusNext(index)"
              @update="saveChange"
              v-model="item.name"
            />
            <SInput
              :placeholder="t('Amount')"
              class="col-span-3"
              inputClass="input-field"
              type="number"
              :id="'input-amount-' + index"
              @update="saveChange"
              @enter="() => focusNext(index)"
              v-model="item.amount"
            />
            <AmountTypeModal
              :ref="(el:any) => (amountRefs[index] = el)"
              class="col-span-3"
              @update="() => { saveChange(); clickNote(index) }"
              v-model="item.amountType"
            />
            <SInput
              :placeholder="t('Note')"
              class="col-span-12"
              inputClass="input-field"
              :id="'input-note-' + index"
              @update="saveChange"
              @enter="() => focusNext(index)"
              v-model="item.note"
            />
          </template>
          <div class="col-span-12 px-3 pb-3 pt-5 rounded-lg relative bg-gray-900 text-2xl text-white">
            <div class="grid grid-cols-12">
              <div class="col-span-10">
                <div class="absolute left-0 text-gray-600 top-0 text-xs ml-3 mt-1">
                  {{ t('Needed amount') }}
                </div>
                  <span class="text-gray-300 font-bold mr-2" @click="() => clickName(index)">{{ item.name || '-' }}</span>
                  <template v-if="unitBefore(item.amountType as any)">
                    <span
                      class="text-red-300"
                      @click="() => clickAmountType(index)"
                      style="font-size: 1.2rem;"
                      >{{ unitLabel(item.amountType as any) }}</span>
                    <span class="font-bold" @click="() => clickAmount(index)">{{ amount(item) }}</span>
                  </template>
                  <template v-else>
                    <span class="font-bold" @click="() => clickAmount(index)">{{ amount(item) }}</span>
                    <span
                      class="text-red-300"
                      @click="() => clickAmountType(index)"
                      style="font-size: 1.2rem;"
                      >{{ unitLabel(item.amountType as any) }}</span>
                  </template>
                <div v-if="item.note" class="text-sm text-gray-400 mt-1">
                  <b>{{ t('Note') }}:</b>
                  <span @click="() => clickNote(index)">{{ item.note }}</span>
                </div>
              </div>
              <div class="col-span-2 relative text-right">
                <template v-if="recipe.checklist">
                  <Checkbox class="absolute right-0 top-0 -mt-1" v-model="item.checked" @input="saveChange" />
                </template>
                <template v-else-if="!recipe.edit">
                  <div class="text-xs whitespace-nowrap absolute top-0 -mt-4 right-0 text-gray-500">
                    <span class="text-gray-600">{{ t('Original') }} </span>
                    {{ item.amount || '0' }}
                  </div>
                  <i
                    @click="() => doOriginal(index)"
                    class="cursor-pointer fal fa-ruler p-2 top-0 -mt-1 absolute right-0 text-gray-600"
                  />
                </template>
                <template v-if="recipe.edit">
                  <i @click="() => moveDown(index)" class="text-sm cursor-pointer fal fa-arrow-down p-2 top-0 mr-24 absolute right-0 text-gray-600" />
                  <i @click="() => moveUp(index)" class="text-sm cursor-pointer fal fa-arrow-up p-2 top-0 mr-16 absolute right-0 text-gray-600" />
                  <i @click="() => deleteIngredient(index)" class="cursor-pointer fal fa-minus-circle p-2 top-0 -mt-1 absolute right-0 text-gray-600" />
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="mb-4 mt-2 text-right">
        <template v-if="recipe.edit">
          <Button @click="addIngredient" color="green">
            <Icon icon="fal fa-plus" class="mr-1" size="1.2rem" />
            {{ t('Add') }}
          </Button>
        </template>
      </div>
        <div class="flex mt-4">
          <template v-if="recipe.edit">
            <SInput :placeholder="t('Recipe URL')" class="flex-grow" @update="saveChange" v-model="recipe.url" />
          </template>
          <template v-if="recipe.url">
            <a :href="recipe.url" class="ml-2" target="_blank" rel="noreferrer">
              <Button class="whitespace-nowrap">
                {{ t('Open recipe web page') }}
                <i class="fal fa-external-link ml-2" />
              </Button>
            </a>
          </template>
        </div>
        <div class="mt-2">
          <Button class="ml-2 whitespace-nowrap" @click="openAskGpt">
            {{ t('Ask GPT') }}
          </Button>
        </div>
        <div>
          <template v-if="recipe.edit">
            <textarea
              :placeholder="t('Note')"
              style="height: 200px"
            class="mt-2 w-full focus:ring-indigo-500 text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md"
            @input="saveChange"
            v-model="recipe.note"
          />
        </template>
        <template v-else-if="recipe.note">
          <p class="text-sm mt-3 px-2"><b>{{ t('Note') }}:</b></p>
          <div class="markdown text-sm px-2" v-html="markedRender"></div>
        </template>
      </div>
    </div>
      <Footer />
    </div>
    <ModalInput
      v-model="showAskGpt"
      :title="t('Ask GPT')"
      :confirmText="t('Ask GPT')"
      :placeholder="t('Question')"
      :cancelText="t('Cancel')"
      :multiline="true"
      @confirm="confirmAskGpt"
    />
  </template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as marked from 'marked'
import Footer from '~components/Footer.vue'
import { recipes as _recipes } from '~src/store/index'
import Button from './Button.vue'
import SInput from './Input.vue'
import Icon from './Icon.vue'
import Checkbox from './Checkbox.vue'
import AmountTypeModal from './AmountTypeModal.vue'
import ModalInput from './ModalInput.vue'
import { t, currentLocale } from '~src/i18n'
import { buildAskRecipePrompt } from '~src/services/prompt'
import { normalizeAmountType } from '~src/services/units'
import { openChatGPT } from '~src/services/chatgpt'

const route = useRoute()
const router = useRouter()

const recipeId = computed(() => {
  return +(route.params.id as any)
})

const recipe = computed<any>({
  get() {
    return _recipes.value?.[recipeId.value]
  },
  set(v) {
    const copy = [..._recipes.value]
    copy[recipeId.value] = v
    _recipes.value = copy
  },
})

if (!_recipes.value || _recipes.value.length === 0) {
  router.push('/')
}

// Ensure view mode when opening a recipe: if currently in edit mode, switch to view
watch(
  () => recipeId.value,
  (id) => {
    const list = _recipes.value
    if (!Array.isArray(list) || id == null) return
    const current = list[id]
    if (current && current.edit) {
      const copy = [...list]
      copy[id] = { ...copy[id], edit: false }
      _recipes.value = copy
    }
  },
  { immediate: true }
)

const markedRender = computed(() => marked.parse(recipe.value?.note || ''))
const ratio = computed(() => (recipe.value ? recipe.value.original / recipe.value.desired : 1))
const showAskGpt = ref(false)

function openAskGpt() {
  showAskGpt.value = true
}

async function confirmAskGpt(question: string) {
  showAskGpt.value = false
  const locale =
    currentLocale.value === 'jp'
      ? 'Japanese'
      : currentLocale.value === 'de'
      ? 'German'
      : 'English'
  const prompt = buildAskRecipePrompt(recipe.value, question, locale)
  const copied = await openChatGPT(prompt)
  if (copied) {
    alert(t('Prompt copied. Paste into ChatGPT.'))
    window.open('https://chatgpt.com/', '_blank')
  }
}

function norm(type: string): string {
  return normalizeAmountType(type)
}

  function amount(item: any): string | number {
    const rat = ratio.value || 1
    const raw = parseFloat((item?.amount ?? 0) as any)
    if (!raw) return '0'
    const type = norm(item?.amountType)

    // Pinch: round up to an integer count
    if (type === 'pinch') {
      return Math.ceil(raw / rat).toFixed(0)
    }

    // Grams/ml: show integer when > 1, otherwise fall through to precise display
    if (type === 'g' || type === 'ml') {
      if (raw > 1) {
        return Math.round(raw / rat)
      }
      // else fall through to generic handling below
    }

    // Units that prefer quarters (¼ ½ ¾)
    const quarterUnits = ['tbl', 'tea', 'p']
    const useQuarter = quarterUnits.includes(type)
    if (useQuarter) {
      let amt = ((Math.round((raw / rat) * 4) / 4).toFixed(2))
      if (amt.includes('.')) {
        let [num, dec] = amt.split('.')
        if (dec) {
          num = +num === 0 ? '' : num
        }
        switch (dec) {
          case '25':
            amt = (num ? num + ' ' : '') + '¼'
            break
          case '50':
            amt = (num ? num + ' ' : '') + '½'
            break
          case '75':
            amt = (num ? num + ' ' : '') + '¾'
            break
          default:
            amt = num
        }
      }
      return amt ? amt : 0
    }

    // Generic: show up to 2 decimals, trim trailing zeros
    const precise = parseFloat(((raw / rat).toFixed(2)))
    return (isNaN(precise) ? 0 : precise)
  }

  function unitBefore(type: string): boolean {
    return ['tbl', 'tea'].includes(norm(type))
  }

  function unitLabel(type: string): string {
    return t('full_' + norm(type))
  }

const amountRefs = ref<any[]>([])
function clickName(index: number) {
  if (recipe.value?.edit) {
    document.getElementById('input-name-' + index)?.focus()
  } else {
    const selection = window.getSelection()
    const range = document.createRange()
    const element = event?.target as HTMLElement
    if (selection && element) {
      range.selectNodeContents(element)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }
}

function clickAmount(index: number) {
  if (recipe.value?.edit) {
    document.getElementById('input-amount-' + index)?.focus()
  } else {
    const selection = window.getSelection()
    const range = document.createRange()
    const element = event?.target as HTMLElement
    if (selection && element) {
      range.selectNodeContents(element)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }
}
function clickAmountType(index: number) {
  if (recipe.value?.edit) {
    amountRefs.value?.[index]?.focus?.()
  } else {
    const selection = window.getSelection()
    const range = document.createRange()
    const element = event?.target as HTMLElement
    if (selection && element) {
      range.selectNodeContents(element)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }
}

function clickNote(index: number) {
  if (recipe.value?.edit) {
    document.getElementById('input-note-' + index)?.focus()
  } else {
    const selection = window.getSelection()
    const range = document.createRange()
    const element = event?.target as HTMLElement
    if (selection && element) {
      range.selectNodeContents(element)
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }
}
function focusNext(index: number) {
  const active = document.activeElement as HTMLElement | null
  if (active?.id === 'input-name-' + index) {
    document.getElementById('input-amount-' + index)?.focus()
    return
  }
  if (active?.id === 'input-amount-' + index) {
    amountRefs.value?.[index]?.focus?.()
    return
  }
  if (active?.id === 'input-note-' + index) {
    const nextName = document.getElementById('input-name-' + (index + 1))
    nextName?.focus()
    return
  }
  clickNote(index)
}
function addIngredient() {
  const copy = [..._recipes.value]
  copy[recipeId.value].ingredients.push({ name: '', amount: '', amountType: 'g', note: '' })
  _recipes.value = copy
  setTimeout(() => {
    const items = [...document.getElementsByClassName('input-field')] as HTMLElement[]
    items[items.length - 2]?.focus()
  }, 0)
}
function switchEdit() {
  const copy = [..._recipes.value]
  copy[recipeId.value].edit = !copy[recipeId.value].edit
  copy[recipeId.value].checklist = false
  _recipes.value = copy
}
function switchCheck() {
  const copy = [..._recipes.value]
  copy[recipeId.value].checklist = !copy[recipeId.value].checklist
  copy[recipeId.value].edit = false
  _recipes.value = copy
}
function clearCheck() {
  const copy = [..._recipes.value]
  copy[recipeId.value].ingredients.forEach((i: any) => (i.checked = false))
  _recipes.value = copy
}
function doOriginal(index: number) {
  const item = recipe.value?.ingredients?.[index]
  if (!item) return
  const amount = parseFloat(item.amount || '0')
  if (!amount) return
  const copy = [..._recipes.value]
  copy[recipeId.value].original = amount
  copy[recipeId.value].desired = amount
  _recipes.value = copy
  setTimeout(() => {
    document.getElementById('input-desired')?.focus()
    document.getElementById('input-desired')?.select()

  }, 0)
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
  const copy = [..._recipes.value]
  const clamp = Math.max(0, index - 1)
  copy[recipeId.value].ingredients = array_move(copy[recipeId.value].ingredients, index, clamp)
  _recipes.value = copy
}
function moveDown(index: number) {
  const copy = [..._recipes.value]
  const clamp = Math.min(copy[recipeId.value].ingredients.length - 1, index + 1)
  copy[recipeId.value].ingredients = array_move(copy[recipeId.value].ingredients, index, clamp)
  _recipes.value = copy
}
function deleteIngredient(index: number) {
  const copy = [..._recipes.value]
  copy[recipeId.value].ingredients = copy[recipeId.value].ingredients.filter((_: any, i: number) => i !== index)
  _recipes.value = copy
}
function saveChange() {
  // recipes ref is reactive; assigning above triggers persistence via external calls
}
</script>

<style scoped>
.title {
  text-overflow: ellipsis;
  white-space: nowrap;
}

</style>
