<template>
  <div v-if="recipe" class='flex-grow flex flex-col'>
    <div class="flex flex-wrap items-center my-1">
      <div class="flex-1 min-w-0 mr-4">
        <h1 class="text-lg font-bold truncate">
          {{ recipe.name }}
        </h1>
      </div>

      <div class="flex items-center">
        <Button v-if="hasNotes" @click="showNotes = !showNotes" class="mr-2" color="text-only">
          <Icon :icon="showNotes ? 'fal fa-eye-slash' : 'fal fa-eye'" class="mr-1 py-[3px]" size="0.8rem" />
          {{ t('Notes') }}
        </Button>

        <Button @click="denseMode = !denseMode" class="mr-2" color="text-only">
          <Icon :icon="denseMode ? 'fal fa-expand' : 'fal fa-compress'" class="py-[3px]" size="0.8rem" />
        </Button>
      </div>

    </div>

    <!-- Clear Checklist Button (below button group) -->
    <div v-if="recipe.checklist" class="flex justify-end mb-2 mt-3 gap-2">
      <Button @click="shareChecklist" color="gray">
        <Icon icon="fal fa-share" class="mr-1" size="0.8rem" />
        {{ t('Share') }}
      </Button>
      <Button @click="clearCheck" color="gray">
        <Icon icon="fal fa-broom" class="mr-1" size="0.8rem" />
        {{ t('Clear checklist') }}
      </Button>
    </div>

    <div class="flex flex-col flex-grow">
      <div class="mb-3 mt-2">
        <!-- Servings Row -->
        <div v-if="!recipe.edit" class="mb-4">
          <div class="rounded-lg bg-gray-900 text-white cursor-pointer" :class="denseMode ? 'px-2 py-2 text-lg' : 'px-3 py-3 text-2xl'" @click="setDesiredFromServings">
            <div class="grid grid-cols-12">
              <div class="col-span-12">
                <span
                  class="text-gray-300 mr-2"
                  :class="{'font-normal': denseMode, 'font-bold': !denseMode}"
                  >{{ scaledServings }}</span>
                <span
                  class="text-red-300"
                  :style="{ fontSize: denseMode ? '1rem' : '1.2rem' }"
                  >{{ t('Servings') }}</span>
            </div>
            </div>
          </div>
        </div>

        <!-- Edit Servings Row -->
        <div v-if="recipe.edit" class="mb-4">
          <div class="grid grid-cols-12 gap-1">
            <div class="col-span-12 relative">
              <input
                type="number"
                :min="1"
                :value="recipe.servings"
                @input="recipe.servings = parseInt(($event.target as HTMLInputElement).value) || 1; saveChange()"
                class="w-full border focus:ring-indigo-500 text-black pt-6 pb-2 pl-3 pr-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md input-field"
              />
              <label class="absolute top-2 left-1.5 text-[10px] font-medium text-gray-500 pointer-events-none z-10 bg-white px-1">{{ t('Servings') }}</label>
            </div>
          </div>
        </div>

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
              :ingredient-index="index"
              @update="() => { saveChange(); clickNote(index) }"
              @update:modelValueWithIndex="handleAmountTypeChange"
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

        <div class="w-full flex justify-end" v-if="recipe.edit">
          <Button @click="addIngredient" color="green">
            <Icon icon="fal fa-plus" class="mr-1" size="1.2rem" />
            {{ t('Add') }}
          </Button>
        </div>
      </div>
        <div class="flex flex-col mt-4">
          <template v-if="recipe.edit">
            <SInput :placeholder="t('Recipe URL')" class="flex-grow" @update="saveChange" v-model="recipe.url" />
          </template>
          <template v-if="recipe.url">
            <a :href="recipe.url" class="mt-1" target="_blank" rel="noreferrer">
              <Button class="whitespace-nowrap">
                <i class="fal fa-globe mr-2" />
                {{ t('Open recipe web page') }}
                <i class="fal fa-xmark ml-2" />
              </Button>
            </a>
          </template>
        </div>
        <div class="mt-2">
          <Button class="whitespace-nowrap" @click="openAskGpt">
            <i class="fal fa-magic mr-2" />
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
          <label v-if="recipe.image" class="text-sm font-medium text-gray-700 mb-2">{{ t('Image') }}</label>
          <template v-if="recipe.edit">
            <div class="flex flex-wrap gap-2">
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
              <input
                ref="cameraInput"
                type="file"
                accept="image/*"
                capture="environment"
                class="hidden"
                @change="handleCameraCapture"
              />
              <Button @click="triggerFileInput" color="gray" class="shrink-0">
                <Icon icon="fal fa-plus" class="mr-1" size="0.8rem" />
                {{ t('Browse Image') }}
              </Button>
              <Button @click="triggerCameraInput" color="gray" class="shrink-0">
                <Icon icon="fal fa-camera" class="mr-1" size="0.8rem" />
                {{ t('Take Photo') }}
              </Button>
            </div>
          </template>
          <template v-if="recipe.image">
            <div class="mt-2 relative">
              <img
                :src="recipe.image"
                alt="Recipe image"
                class="max-w-full h-auto rounded-lg shadow-md"
                :class="{ 'cursor-pointer hover:opacity-90 transition-opacity': !recipe.edit }"
                style="max-height: 300px;"
                @click="!recipe.edit ? openImageZoomModal() : null"
              />
              <template v-if="recipe.edit">
                <div class="absolute top-2 right-2 flex space-x-2">
                  <Button
                    @click="openCropModal"
                    color="blue"
                    :class="'bg-blue-600 hover:bg-blue-700'"
                  >
                    <Icon icon="fal fa-crop" size="0.8rem" />
                  </Button>
                  <Button
                    @click="deleteImage"
                    color="red"
                    :class="'bg-red-600 hover:bg-red-700'"
                  >
                    <Icon icon="fal fa-trash" size="0.8rem" />
                  </Button>
                </div>
              </template>
            </div>
          </template>
        </div>

        <!-- Tags Section (Edit Mode - below image) -->
        <div v-if="recipe.edit" class="mt-4">
          <TagInput v-model="recipe.tags" @update:modelValue="saveChange" />
        </div>

        <!-- Cooked history -->
        <Cooked :recipe="recipe" :edit-mode="!!recipe.edit" />
      </div>
    </div>

    <!-- JSON Import Button (Edit Mode Only) -->
    <div v-if="recipe.edit" class="mt-4 mb-2">
      <Button @click="openImportJson" color="gray" class="!text-xs">
        <Icon icon="fal fa-upload" class="mr-1" size="0.8rem" />
        {{ t('Import JSON') }}
      </Button>
    </div>

      <Footer />
    </div>
    <ModalAskGpt
      v-model="showAskGpt"
      :confirmText="t('Ask GPT')"
      :cancelText="t('Cancel')"
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
    <ModalPromptReady
      v-model="showPromptReadyModal"
      :message="promptReadyMessage"
      :aiService="promptReadyAIService"
      :gotoText="promptReadyGotoText"
      :gotoUrl="promptReadyGotoUrl"
      @goToAI="handleGoToAI"
    />
    <ModalCropImage
      v-model="showCropModal"
      :imageSrc="recipe.image || ''"
      @confirm="confirmCropImage"
    />
    <ModalInput
      v-model="showImportJsonModal"
      :value="importJsonText"
      :title="t('Import JSON')"
      :confirmText="t('Import')"
      :placeholder="t('Paste JSON')"
      :multiline="true"
      @confirm="confirmImportJson"
      @cancel="cancelImportJson"
    />
    <ModalImageZoom
      v-model="showImageZoomModal"
      :imageSrc="recipe.image || ''"
    />
  </template>

<script lang="ts" setup>
import { computed, ref, watch, watchEffect, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as marked from 'marked'
import Footer from '~components/Footer.vue'
import { recipes as _recipes, globalSearchFilter, recipeViewSettings, recipesInitialized } from '~src/store/index'
import Button from './Button.vue'
import SInput from './Input.vue'
import Icon from './Icon.vue'
import Checkbox from './Checkbox.vue'
import AmountTypeModal from './AmountTypeModal.vue'
import ModalAskGpt from './ModalAskGpt.vue'
import ModalNotice from './ModalNotice.vue'
import ModalPromptReady from './ModalPromptReady.vue'
import ModalCropImage from './ModalCropImage.vue'
import ModalImageZoom from './ModalImageZoom.vue'
import ModalInput from './ModalInput.vue'
import TagInput from './TagInput.vue'
import Cooked from './Cooked.vue'
import { t, currentLocale } from '~src/i18n'
import { buildAskRecipePrompt } from '~src/services/prompt'
import { normalizeAmountType } from '~src/services/units'
import { isValidImageFile, pasteImageFromClipboard } from '~src/services/indexeddb'
import { optimizeImageFile } from '~src/services/imageOptimization'
import { handlePromptNoticeOk } from '~src/services/notice'
// no auto-opening; we'll copy prompt and show CTA

const route = useRoute()
const router = useRouter()
const pasteArea = ref<HTMLDivElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)

// Use global settings for dense mode and show notes
const showNotes = computed({
  get: () => recipeViewSettings.value.showNotes,
  set: (value) => recipeViewSettings.value.showNotes = value
})

const denseMode = computed({
  get: () => recipeViewSettings.value.denseMode,
  set: (value) => recipeViewSettings.value.denseMode = value
})

const recipeId = computed(() => {
  return route.params.recipeId as string
})

const recipeIndex = computed(() => {
  return _recipes.value.findIndex(recipe => recipe.id === recipeId.value)
})

const recipe = computed<any>({
  get() {
    return _recipes.value?.[recipeIndex.value]
  },
  set(v) {
    const copy = [..._recipes.value]
    copy[recipeIndex.value] = v
    _recipes.value = copy
  },
})

watchEffect(() => {
  if (!recipesInitialized.value) return
  if (!recipe.value) {
    router.replace('/')
  }
})

// Ensure view mode when opening a recipe: if currently in edit mode, switch to view
watch(
  () => recipeIndex.value,
  (index) => {
    const list = _recipes.value
    if (!Array.isArray(list) || index < 0) return
    const current = list[index]
    if (current && current.edit) {
      const copy = [...list]
      copy[index] = { ...copy[index], edit: false }
      _recipes.value = copy
    }
  },
  { immediate: true }
)

const markedRender = computed(() => (marked as any).parse(recipe.value?.note || ''))
const ratio = computed(() => (recipe.value ? recipe.value.original / recipe.value.desired : 1))

const scaledServings = computed(() => {
  const servings = recipe.value?.servings || 2
  const rat = ratio.value || 1
  let amt = Math.round((servings / rat) * 4) / 4
  let display = amt.toFixed(2)

  if (display.includes('.')) {
    let [num, dec] = display.split('.')
    if (dec) {
      num = +num === 0 ? '' : num
    }
    switch (dec) {
      case '25':
        display = (num ? num + ' ' : '') + '¼'
        break
      case '50':
        display = (num ? num + ' ' : '') + '½'
        break
      case '75':
        display = (num ? num + ' ' : '') + '¾'
        break
      default:
        display = num || '0'
    }
  }

  return display || '0'
})

const hasNotes = computed(() => {
  return recipe.value?.ingredients?.some((item: any) => item.note && item.note.trim()) || false
})

const showAskGpt = ref(false)
const showNotice = ref(false)
const noticeTitle = ref('')
const noticeMessage = ref('')
const noticeIcon = ref('fal fa-info-circle')
const noticeOkText = ref(t('Got it'))

// ModalPromptReady state
const showPromptReadyModal = ref(false)
const promptReadyMessage = ref('')
const promptReadyAIService = ref<'chatgpt' | 'gemini'>('chatgpt')
const promptReadyGotoText = ref('')
const promptReadyGotoUrl = ref('')

// ModalCropImage state
const showCropModal = ref(false)

// ModalImportJson state
const showImportJsonModal = ref(false)
const importJsonText = ref('')

// ModalImageZoom state
const showImageZoomModal = ref(false)

function openAskGpt() {
  showAskGpt.value = true
}

function openImportJson() {
  importJsonText.value = ''
  showImportJsonModal.value = true
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
  showPromptReady(
    t('We copied the prompt to your clipboard. Paste the prompt and send it.'),
    'chatgpt',
    t('Goto ChatGPT'),
    'https://chatgpt.com/'
  )
}

function confirmImportJson(json: string) {
  showImportJsonModal.value = false
  try {
    const parsed = JSON.parse(json)
    // Update the current recipe with the imported data
    const updatedRecipe = { ...recipe.value, ...parsed }
    recipe.value = updatedRecipe
    showAppNotice(t('Success'), t('Recipe updated from JSON'), 'fal fa-check-circle')
  } catch (e) {
    showAppNotice(t('Error'), t('Invalid JSON'), 'fal fa-exclamation-triangle')
  }
}

function cancelImportJson() {
  importJsonText.value = ''
  showImportJsonModal.value = false
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
  copy[recipeIndex.value].ingredients.push({ name: '', amount: '', amountType: 'g', note: '' })
  _recipes.value = copy
  setTimeout(() => {
    const items = [...document.getElementsByClassName('input-field')] as HTMLElement[]
    items[items.length - 3]?.focus()
  }, 0)
}

function handleAmountTypeChange(newType: string, index: number) {
  const copy = [..._recipes.value]
  const ingredients = copy[recipeIndex.value].ingredients

  // Update the current ingredient
  ingredients[index].amountType = newType
  _recipes.value = copy
}

function switchEdit() {
  const copy = [..._recipes.value]
  copy[recipeIndex.value].edit = !copy[recipeIndex.value].edit
  copy[recipeIndex.value].checklist = false
  // Initialize tags array if it doesn't exist
  if (!copy[recipeIndex.value].tags) {
    copy[recipeIndex.value].tags = []
  }
  _recipes.value = copy
}
function switchCheck() {
  const copy = [..._recipes.value]
  copy[recipeIndex.value].checklist = !copy[recipeIndex.value].checklist
  copy[recipeIndex.value].edit = false
  _recipes.value = copy
}
function clearCheck() {
  const copy = [..._recipes.value]
  copy[recipeIndex.value].ingredients.forEach((i: any) => (i.checked = false))
  _recipes.value = copy
}

function formatIngredientForShare(item: any): string {
  if (!item) {
    return `- ${t('Ingredient')}`
  }

  const rawName = typeof item.name === 'string' ? item.name.trim() : ''
  const name = rawName || t('Ingredient')
  const note = typeof item.note === 'string' ? item.note.trim() : ''

  const amountValue = amount(item)
  const amountText = amountValue == null ? '' : String(amountValue).trim()
  const hasAmount = amountText !== '' && amountText !== '0' && amountText !== '0.00'

  const normalizedType = norm(item.amountType || '')
  let unitText = unitLabel(item.amountType as any) || ''
  unitText = unitText.trim()
  if (unitText.startsWith('full_')) {
    unitText = normalizedType
  }
  unitText = unitText.trim()
  const hasUnit = unitText !== '' && unitText !== '0'

  let measurement = ''
  if (hasAmount && hasUnit) {
    measurement = unitBefore(item.amountType || '') ? `${unitText} ${amountText}` : `${amountText} ${unitText}`
  } else if (hasAmount) {
    measurement = amountText
  } else if (hasUnit) {
    measurement = unitText
  }

  const parts = [measurement, name].filter(part => part && part.trim().length > 0)
  let line = `- ${parts.join(' ').replace(/\s+/g, ' ').trim()}`
  if (note) {
    line += ` (${note})`
  }
  return line
}

async function copyChecklistToClipboard(text: string) {
  const copyLegacy = () => {
    legacyCopyToClipboard(text)
    showAppNotice(t('Copied to clipboard'), t('Recipe checklist copied to clipboard'), 'fal fa-check-circle')
  }

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      showAppNotice(t('Copied to clipboard'), t('Recipe checklist copied to clipboard'), 'fal fa-check-circle')
      return
    } catch (_) {
      try {
        copyLegacy()
        return
      } catch (legacyError) {
        throw legacyError
      }
    }
  }

  try {
    copyLegacy()
  } catch (legacyError) {
    throw legacyError
  }
}

async function shareChecklist() {
  const currentRecipe = recipe.value
  const ingredients = currentRecipe?.ingredients || []

  if (!currentRecipe || ingredients.length === 0) {
    showAppNotice(t('No ingredients to share'), t('This recipe has no ingredients to share'), 'fal fa-info-circle')
    return
  }

  const lines = ingredients
    .map((item: any) => formatIngredientForShare(item))
    .filter(line => line && line.trim().length > 0)

  if (lines.length === 0) {
    showAppNotice(t('No ingredients to share'), t('This recipe has no ingredients to share'), 'fal fa-info-circle')
    return
  }
  const title = currentRecipe.name?.trim() || t('Recipe')
  const shareText = `${title}\n\n${lines.join('\n')}`.trim()

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: shareText
      })
      return
    } catch (error) {
      console.warn('navigator.share failed, falling back to clipboard', error)
    }
  }

  try {
    await copyChecklistToClipboard(shareText)
  } catch (error) {
    console.error('Failed to share recipe checklist:', error)
    showAppNotice(t('Share failed'), t('Unable to share recipe checklist'), 'fal fa-exclamation-triangle')
  }
}

function clearNote(index: number) {
  const copy = [..._recipes.value]
  copy[recipeIndex.value].ingredients[index].note = ''
  _recipes.value = copy
}
function doOriginal(index: number) {
  const item = recipe.value?.ingredients?.[index]
  if (!item) return
  const amount = parseFloat(item.amount || '0')
  if (!amount) return
  const copy = [..._recipes.value]
  copy[recipeIndex.value].original = amount
  copy[recipeIndex.value].desired = amount
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


function setDesiredFromServings() {
  const servings = recipe.value?.servings || 2
  const copy = [..._recipes.value]
  copy[recipeIndex.value].original = servings
  copy[recipeIndex.value].desired = servings
  _recipes.value = copy
  setTimeout(() => {
    const input = document.getElementById('input-desired') as HTMLInputElement
    input?.focus()
    input?.select()
  }, 0)
}

function setDesiredFromIngredient(index: number) {
  const item = recipe.value?.ingredients?.[index]
  if (!item) return
  const amount = parseFloat(item.amount || '0')
  if (!amount) return
  const copy = [..._recipes.value]
  copy[recipeIndex.value].desired = amount
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
  copy[recipeIndex.value].ingredients = array_move(copy[recipeIndex.value].ingredients, index, clamp)
  _recipes.value = copy
}
function moveDown(index: number) {
  const copy = [..._recipes.value]
  const clamp = Math.min(copy[recipeIndex.value].ingredients.length - 1, index + 1)
  copy[recipeIndex.value].ingredients = array_move(copy[recipeIndex.value].ingredients, index, clamp)
  _recipes.value = copy
}
function deleteIngredient(index: number) {
  const copy = [..._recipes.value]
  copy[recipeIndex.value].ingredients = copy[recipeIndex.value].ingredients.filter((_: any, i: number) => i !== index)
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

function showPromptReady(message: string, aiService: 'chatgpt' | 'gemini' = 'chatgpt', gotoText?: string, gotoUrl?: string) {
  promptReadyMessage.value = message
  promptReadyAIService.value = aiService
  promptReadyGotoText.value = gotoText || ''
  promptReadyGotoUrl.value = gotoUrl || ''
  showPromptReadyModal.value = true
}

function handleGoToAI() {
  if (promptReadyGotoUrl.value) {
    handlePromptNoticeOk(promptReadyGotoUrl.value, openImportJson)
  } else {
    openImportJson()
  }
}

// Image handling functions
function triggerFileInput() {
  fileInput.value?.click()
}

function triggerCameraInput() {
  cameraInput.value?.click()
}

async function processSelectedFile(file?: File | null) {
  if (!file) return
  if (!isValidImageFile(file)) {
    showAppNotice(t('Invalid file'), t('Please select a valid image file (JPEG, PNG, GIF, WebP) under 50MB'), 'fal fa-exclamation-triangle')
    return
  }
  try {
    const base64 = await optimizeImageFile(file)
    updateRecipeImage(base64)
  } catch (error) {
    console.error('Failed to process image file:', error)
    showAppNotice(t('Error'), t('Failed to process image file'), 'fal fa-exclamation-triangle')
  }
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  await processSelectedFile(file)
  if (target) target.value = ''
}

async function handleCameraCapture(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  await processSelectedFile(file)
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
  copy[recipeIndex.value].image = base64
  _recipes.value = copy
}

function deleteImage() {
  const copy = [..._recipes.value]
  copy[recipeIndex.value].image = undefined
  _recipes.value = copy
}

async function openCropModal() {
  if (recipe.value?.image) {
    // Force reactivity update
    await nextTick()
    // Small delay to ensure image is properly set
    await new Promise(resolve => setTimeout(resolve, 10))
    showCropModal.value = true
  }
}

function confirmCropImage(croppedImage: string) {
  updateRecipeImage(croppedImage)
  showCropModal.value = false
}

function openImageZoomModal() {
  if (recipe.value?.image) {
    showImageZoomModal.value = true
  }
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
