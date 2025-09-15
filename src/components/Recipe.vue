<template>
  <div v-if="recipe" class='flex-grow flex flex-col'>
    <div class="flex items-center my-1">
      <div class="flex-1"></div>

      <Button @click="denseMode = !denseMode" class="mr-2" color="gray">
        <Icon :icon="denseMode ? 'fal fa-expand' : 'fal fa-compress'" class="py-[3px]" size="0.8rem" />
      </Button>

      <ModeButtonGroup
        :mode="currentMode"
        @mode-change="handleModeChange"
        class="mr-2"
      />
    </div>

    <!-- Clear Checklist Button (below button group) -->
    <div v-if="recipe.checklist" class="flex justify-end mb-2">
      <Button @click="clearCheck" color="gray">
        <Icon icon="fal fa-broom" class="mr-1" size="0.8rem" />
        {{ t('Clear checklist') }}
      </Button>
    </div>

    <div class="flex flex-col flex-grow">
      <div class="mb-3 mt-2">
        <TransitionGroup name="ri" tag="div" appear>
          <div
            v-for="(item, index) in recipe.ingredients"
            :key="index"
            :class="[
              'grid grid-cols-12 gap-1',
              denseMode ? 'mb-1' : 'mb-3'
            ]"
            :style="staggerStyle(index)"
          >
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
            <div class="col-span-12 flex">
              <SInput
                :placeholder="t('Note')"
                class="flex-1"
                inputClass="input-field"
                :id="'input-note-' + index"
                @update="saveChange"
                @enter="() => focusNext(index)"
                v-model="item.note"
              />
              <Button v-if="item.note" @click.stop="() => clearNote(index)" class="ml-1" color="gray">
                <Icon icon="fal fa-broom" class="mr-1" size="0.8rem" />
              </Button>
            </div>
          </template>
          <div
            :class="[
              'col-span-12 rounded-lg relative bg-gray-900 text-white',
              denseMode ? 'px-2 py-2 text-lg' : 'px-3 pb-3 pt-5 text-2xl'
            ]"
            @click="handleIngredientClick(index)"
          >
            <div class="grid grid-cols-12">
              <div class="col-span-10">

                  <span class="text-gray-300 mr-2" :class="{'font-normal': denseMode, 'font-bold': !denseMode}" @click.stop="() => clickName(index)">{{ item.name || '-' }}</span>
                  <template v-if="unitBefore(item.amountType as any)">
                    <span
                      class="text-red-300"
                      @click.stop="() => clickAmountType(index)"
                      :style="{ fontSize: denseMode ? '1rem' : '1.2rem' }"
                      >{{ unitLabel(item.amountType as any) }}</span>
                    <span class="font-bold" @click.stop="() => clickAmount(index)">{{ amount(item) }}</span>
                  </template>
                  <template v-else>
                    <span class="font-bold" @click.stop="() => clickAmount(index)">{{ amount(item) }}</span>
                    <span
                      class="text-red-300"
                      @click.stop="() => clickAmountType(index)"
                      :style="{ fontSize: denseMode ? '1rem' : '1.2rem' }"
                      >{{ unitLabel(item.amountType as any) }}</span>
                  </template>
                <div v-if="item.note && (recipe.edit || showNotes)" :class="[
                  'text-gray-400 mt-1',
                  denseMode ? 'text-xs' : 'text-sm'
                ]">
                  <b class='mr-1'>{{ t('Note') }}:</b>
                  <span @click.stop="() => clickNote(index)">{{ item.note }}</span>
                </div>
              </div>
              <div class="col-span-2 relative text-right">
                <template v-if="recipe.checklist">
                  <Checkbox class="absolute right-0 top-0 -mt-1" v-model="item.checked" @input="saveChange" />
                </template>
                <template v-else-if="!recipe.edit && !denseMode">
                  <div class="text-xs whitespace-nowrap absolute top-0 -mt-4 right-0 text-gray-500">
                    <span class="text-gray-600">{{ t('Original') }} </span>
                    {{ item.amount || '0' }}
                  </div>
                  <i
                    @click.stop="() => doOriginal(index)"
                    class="cursor-pointer fal fa-ruler p-2 top-0 -mt-1 absolute right-0 text-gray-500"
                  />
                </template>
                <template v-if="recipe.edit">
                  <i @click.stop="() => moveDown(index)" :class="[
                    'cursor-pointer fal fa-arrow-down top-0 absolute right-0 text-gray-600',
                    denseMode ? 'text-xs p-1 mr-20' : 'text-sm p-2 mr-24'
                  ]" />
                  <i @click.stop="() => moveUp(index)" :class="[
                    'cursor-pointer fal fa-arrow-up top-0 absolute right-0 text-gray-600',
                    denseMode ? 'text-xs p-1 mr-16' : 'text-sm p-2 mr-16'
                  ]" />
                  <i @click.stop="() => deleteIngredient(index)" :class="[
                    'cursor-pointer fal fa-minus-circle top-0 absolute right-0 text-gray-600',
                    denseMode ? 'text-xs p-1 -mt-0.5' : 'p-2 -mt-1'
                  ]" />
                </template>
              </div>
            </div>
            </div>
          </div>
        </TransitionGroup>

        <div class="w-full flex justify-end">
          <Button @click="showNotes = !showNotes" class="" color="gray">
            <template v-if="showNotes">
              <Icon icon="fal fa-eye-slash" class="mr-1" size="0.8rem" />
              {{ t('Notes') }}
            </template>
            <template v-else>
              <Icon icon="fal fa-eye" class="mr-1" size="0.8rem" />
              {{ t('Notes') }}
            </template>
          </Button>
        </div>
      </div>
      <div class="mb-4 mt-2 text-right"  v-if="recipe.edit">
        <template>
          <Button @click="addIngredient" color="green">
            <Icon icon="fal fa-plus" class="mr-1" size="1.2rem" />
            {{ t('Add') }}
          </Button>
        </template>
      </div>
        <div class="flex flex-col mt-4">
          <template v-if="recipe.edit">
            <SInput :placeholder="t('Recipe URL')" class="flex-grow" @update="saveChange" v-model="recipe.url" />
          </template>
          <template v-if="recipe.url">
            <a :href="recipe.url" class="mt-1" target="_blank" rel="noreferrer">
              <Button class="whitespace-nowrap">
                {{ t('Open recipe web page') }}
                <i class="fal fa-external-link ml-2" />
              </Button>
            </a>
          </template>
        </div>
        <div class="mt-2">
          <Button class="whitespace-nowrap" @click="openAskGpt">
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

        <!-- Tags Section (View Mode - above image) -->
        <div v-if="!recipe.edit && recipe.tags && recipe.tags.length > 0" class="mt-4">
          <label class="text-sm font-medium text-gray-700 mb-3 block">{{ t('Tags') }}</label>
          <div class="flex flex-wrap gap-2">
            <span
              v-for="tag in [...recipe.tags].sort((a, b) => a.localeCompare(b))"
              :key="tag"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 border-blue-200 border text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
              @click="searchByTag(tag)"
              :title="t('Click to search for this tag')"
            >
              {{ tag }}
            </span>
          </div>
        </div>

        <!-- Image Section -->
        <div class="flex flex-col mt-4">
          <label class="text-sm font-medium text-gray-700 mb-2">{{ t('Image') }}</label>
          <template v-if="recipe.edit">
            <div class="flex gap-2">
              <div
                ref="pasteArea"
                contenteditable="true"
                :placeholder="t('Paste image here')"
                class="flex-1 border focus:ring-indigo-500 text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md min-h-[40px] focus:outline-none bg-white"
                @paste="handlePaste"
                @input="handleContentEditableInput"
              ></div>
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileSelect"
              />
              <Button @click="triggerFileInput" color="gray">
                <Icon icon="fal fa-plus" class="mr-1" size="0.8rem" />
                {{ t('Add') }}
              </Button>
            </div>
          </template>
          <template v-if="recipe.image">
            <div class="mt-2 relative">
              <img
                :src="recipe.image"
                alt="Recipe image"
                class="max-w-full h-auto rounded-lg shadow-md"
                style="max-height: 300px;"
              />
              <template v-if="recipe.edit">
                <Button
                  @click="deleteImage"
                  class="absolute top-2 right-2"
                  color="red"
                  :class="'bg-red-600 hover:bg-red-700'"
                >
                  <Icon icon="fal fa-trash" size="0.8rem" />
                </Button>
              </template>
            </div>
          </template>
        </div>

        <!-- Tags Section (Edit Mode - below image) -->
        <div v-if="recipe.edit" class="mt-4">
          <TagInput v-model="recipe.tags" @update:modelValue="saveChange" />
        </div>
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
    <ModalNotice
      v-model="showNotice"
      :title="noticeTitle"
      :message="noticeMessage"
      :icon="noticeIcon"
      :okText="noticeOkText"
      @ok="openChatGPTTab"
    />
  </template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as marked from 'marked'
import Footer from '~components/Footer.vue'
import { recipes as _recipes, globalSearchFilter } from '~src/store/index'
import Button from './Button.vue'
import SInput from './Input.vue'
import Icon from './Icon.vue'
import Checkbox from './Checkbox.vue'
import AmountTypeModal from './AmountTypeModal.vue'
import ModalInput from './ModalInput.vue'
import ModalNotice from './ModalNotice.vue'
import TagInput from './TagInput.vue'
import ModeButtonGroup from './ModeButtonGroup.vue'
import { t, currentLocale } from '~src/i18n'
import { buildAskRecipePrompt } from '~src/services/prompt'
import { normalizeAmountType } from '~src/services/units'
import { fileToBase64, isValidImageFile, pasteImageFromClipboard } from '~src/services/indexeddb'
// no auto-opening; we'll copy prompt and show CTA

const route = useRoute()
const router = useRouter()
const showNotes = ref(false)
const denseMode = ref(false)
const pasteArea = ref<HTMLDivElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

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

const markedRender = computed(() => (marked as any).parse(recipe.value?.note || ''))
const ratio = computed(() => (recipe.value ? recipe.value.original / recipe.value.desired : 1))

const currentMode = computed<'view' | 'edit' | 'checklist'>(() => {
  if (recipe.value?.edit) return 'edit'
  if (recipe.value?.checklist) return 'checklist'
  return 'view'
})
const showAskGpt = ref(false)
const showNotice = ref(false)
const noticeTitle = ref('')
const noticeMessage = ref('')
const noticeIcon = ref('fal fa-info-circle')
const noticeOkText = ref(t('Got it'))

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
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(prompt)
    } else {
      legacyCopyToClipboard(prompt)
    }
  } catch (_) {
    legacyCopyToClipboard(prompt)
  }
  showAppNotice(
    t('Prompt ready'),
    t('We copied the prompt to your clipboard. Paste the prompt and send it.'),
    'fal fa-comment-alt',
    t('Goto ChatGPT')
  )
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
function handleModeChange(newMode: 'view' | 'edit' | 'checklist') {
  const copy = [..._recipes.value]
  if (newMode === 'edit') {
    copy[recipeId.value].edit = true
    copy[recipeId.value].checklist = false
    // Initialize tags array if it doesn't exist
    if (!copy[recipeId.value].tags) {
      copy[recipeId.value].tags = []
    }
  } else if (newMode === 'checklist') {
    copy[recipeId.value].checklist = true
    copy[recipeId.value].edit = false
  } else {
    copy[recipeId.value].edit = false
    copy[recipeId.value].checklist = false
  }
  _recipes.value = copy
}

function switchEdit() {
  const copy = [..._recipes.value]
  copy[recipeId.value].edit = !copy[recipeId.value].edit
  copy[recipeId.value].checklist = false
  // Initialize tags array if it doesn't exist
  if (!copy[recipeId.value].tags) {
    copy[recipeId.value].tags = []
  }
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
function clearNote(index: number) {
  const copy = [..._recipes.value]
  copy[recipeId.value].ingredients[index].note = ''
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
    const input = document.getElementById('input-desired') as HTMLInputElement
    input?.focus()
    input?.select()

  }, 0)
}

function handleIngredientClick(index: number) {
  if (!recipe.value?.edit && !recipe.value?.checklist) {
    // In both dense and normal mode: set both original and desired (same as ruler button)
    doOriginal(index)
  }
}

function setDesiredFromIngredient(index: number) {
  const item = recipe.value?.ingredients?.[index]
  if (!item) return
  const amount = parseFloat(item.amount || '0')
  if (!amount) return
  const copy = [..._recipes.value]
  copy[recipeId.value].desired = amount
  _recipes.value = copy
  setTimeout(() => {
    const input = document.getElementById('input-desired') as HTMLInputElement
    input?.focus()
    input?.select()
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

function showAppNotice(title: string, message: string, icon?: string, okText?: string) {
  noticeTitle.value = title
  noticeMessage.value = message
  noticeIcon.value = icon || 'fal fa-info-circle'
  noticeOkText.value = okText || t('Got it')
  showNotice.value = true
}

// Image handling functions
function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file && isValidImageFile(file)) {
    try {
      const base64 = await fileToBase64(file)
      updateRecipeImage(base64)
    } catch (error) {
      console.error('Failed to process image file:', error)
      showAppNotice(t('Error'), t('Failed to process image file'), 'fal fa-exclamation-triangle')
    }
  } else if (file) {
    showAppNotice(t('Invalid file'), t('Please select a valid image file (JPEG, PNG, GIF, WebP) under 5MB'), 'fal fa-exclamation-triangle')
  }
  // Clear the input
  if (target) target.value = ''
}

function handleContentEditableInput(event: Event) {
  // Handle input changes in contenteditable div
  const target = event.target as HTMLDivElement
  // If there's an image in the content, extract it
  const images = target.querySelectorAll('img')
  if (images.length > 0) {
    const img = images[0] as HTMLImageElement
    if (img.src && img.src.startsWith('data:')) {
      updateRecipeImage(img.src)
      // Clear the contenteditable area after extracting the image
      target.innerHTML = ''
    }
  }
}

async function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  try {
    const base64 = await pasteImageFromClipboard(event.clipboardData || undefined)
    if (base64) {
      updateRecipeImage(base64)
      // Clear the contenteditable area after successful paste
      if (pasteArea.value) {
        pasteArea.value.innerHTML = ''
      }
    } else {
      showAppNotice(t('No image found'), t('No valid image found in clipboard'), 'fal fa-exclamation-triangle')
    }
  } catch (error) {
    console.error('Failed to paste image:', error)
    showAppNotice(t('Error'), t('Failed to paste image from clipboard'), 'fal fa-exclamation-triangle')
  }
}

function updateRecipeImage(base64: string) {
  const copy = [..._recipes.value]
  copy[recipeId.value].image = base64
  _recipes.value = copy
}

function deleteImage() {
  const copy = [..._recipes.value]
  copy[recipeId.value].image = undefined
  _recipes.value = copy
}

function openChatGPTTab() {
  window.open('https://chatgpt.com/', '_blank')
}

function searchByTag(tag: string) {
  // Set the global search filter to the clicked tag
  globalSearchFilter.value = tag
  // Navigate back to overview where the filter will be applied
  router.push('/')
}

// Small stagger for enter transitions, clamped to 200ms total
function staggerStyle(i: number) {
  const step = 20
  const delay = Math.min(i * step, 200)
  return { transitionDelay: `${delay}ms` } as any
}

// Legacy clipboard copy for widest compatibility
function legacyCopyToClipboard(text: string) {
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  } catch (_) {
    /* no-op */
  }
}
</script>

<style scoped>
/* Ingredient list enter animation (fade + slight slide down) */
.ri-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.ri-enter-active {
  transition: opacity 150ms ease-out, transform 150ms ease-out;
}
.ri-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* Enable move transitions when reordering */
.ri-move {
  transition: transform 150ms ease-out;
}

/* Contenteditable styling */
[contenteditable]:empty:before {
  content: attr(placeholder);
  color: #9ca3af;
  pointer-events: none;
}

[contenteditable] {
  white-space: pre-wrap;
  word-wrap: break-word;
}

[contenteditable] img {
  max-width: 100%;
  max-height: 200px;
  border-radius: 6px;
  margin: 4px 0;
}
</style>
