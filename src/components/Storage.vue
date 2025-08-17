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



    <ModalInput
      v-model="showImportUrlModal"
      :value="importUrl"
      :title="t('JSON from URL')"
      :confirmText="t('Open GPT')"
      :placeholder="t('https://example.com')"
      @confirm="confirmImportUrl"
      @cancel="cancelImportUrl"
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

    <div class='flex-grow'>
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
    </div>

    <!-- Moved JSON controls to bottom of overview -->
    <div class="mt-2 flex">
      <Button class="mx-2 flex-1 !text-xs" @click="openImportUrl">{{ t('JSON from URL') }}</Button>
      <Button class="mx-2 flex-1 !text-xs" @click="openImportJson">{{ t('Import JSON') }}</Button>
      <Button class="mx-2 flex-1 !text-xs" @click="exportAll">{{ t('Export to JSON') }}</Button>
    </div>
    <Footer />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { t, currentLocale } from '~src/i18n'
import Footer from '~components/Footer.vue'
import { recipes as _recipes } from '~src/store/index'
import Button from './Button.vue'
import SInput from './Input.vue'
import { newRecipe } from '~plugins/helper'
import Icon from './Icon.vue'
import ModalConfirm from './ModalConfirm.vue'
import ModalInput from './ModalInput.vue'

const router = useRouter()
const recipes = computed({ get: () => _recipes.value, set: (v) => (_recipes.value = v as any) })
let recipeName = ref('')
let showDeleteConfirm = ref(false)
let deleteConfirmName = ref('')
let deleteIndex = ref<number | null>(null)
let showImportUrlModal = ref(false)
let showImportJsonModal = ref(false)
let importUrl = ref('')
let importJsonText = ref('')

const route = useRoute()

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

function openImportUrl() {
  importUrl.value = ''
  showImportUrlModal.value = true
}

function confirmImportUrl(url: string) {
  importUrl.value = url
  showImportUrlModal.value = false
  const locale = currentLocale.value === 'jp' ? 'Japanese' : 'English'
  const unitRules = [
    'Map units to one of: g, ㏄ (ml), 大さじ (tablespoon), 小さじ (teaspoon), 個 (piece).',
    'If source has ml use ㏄; tablespoon->大さじ; teaspoon->小さじ; piece/whole->個.',
  ].join(' ')
  const ingredientRules = [
    'For each ingredient: remove any text in brackets/parentheses from the name (e.g., "Onion (chopped)" -> name: "Onion").',
    'Move removed bracket details and any extra descriptors (e.g., "chopped", "to taste") into the ingredient.note field, in ' +
    locale +
    '.',
    'Every ingredient must have an amount. If the source has no numeric amount, set amount to 0 and explain the original wording in ingredient.note (in ' +
    locale +
    ').',
  ].join(' ')
  const noteRules = [
    'The top-level note must be present and non-empty.',
    'Start with a concise, useful description of the dish (what it is, cuisine/style, key flavors/ingredients, typical serving or occasion) in ' +
    locale +
    '.',
    'Then briefly list assumptions you made, details removed from brackets, and any missing/ambiguous amounts, also in ' +
    locale +
    '.',
    'Do not mention this prompt, ChatGPT, or any app/tool; focus only on the recipe itself.',
    'You may use Markdown formatting in the description including headers, lists, bold and italic text.',
    'Structure the description with clear sections for overview, ingredients needed, detailed steps, tips/notes.',
  ].join(' ')
  const localeRule = 'All text values must be written in ' + locale + '.'
  const jsonSchema =
    '{"name":"string","edit":true,"original":number,"desired":number,"note":"string","url":"string","ingredients":[{"name":"string","amount":number,"amountType":"g|㏄|大さじ|小さじ|個","note":"string"}]}'
  const formattingRule =
    'Return the result as a Markdown fenced code block using four backticks with the `json` language tag (start with ````json and end with ````). The content of the block must be only valid JSON matching the schema.'
  const prompt =
    'Fetch the content of ' +
    url +
    ' and convert it into a clean, structured recipe JSON. ' +
    localeRule +
    ' Follow these strict rules: ' +
    unitRules +
    ' ' +
    ingredientRules +
    ' ' +
    noteRules +
    ' The JSON must match this exact structure: ' +
    jsonSchema +
    ' ' +
    formattingRule

  console.log('https://chatgpt.com/?q=' + encodeURIComponent(prompt))
  window.open('https://chatgpt.com/?q=' + encodeURIComponent(prompt), '_blank')
}

function openImportJson() {
  importJsonText.value = ''
  showImportJsonModal.value = true
}

function confirmImportJson(json: string) {
  showImportJsonModal.value = false
  try {
    const parsed = parsePastedJson(json)
    if (!parsed) throw new Error('No JSON found')
    // Ensure minimal shape expected by the app
    if (!parsed.edit) parsed.edit = true
    if (!Array.isArray(parsed.ingredients)) parsed.ingredients = []
    parsed.ingredients = parsed.ingredients.map((ing: any) => ({
      name: ing?.name ?? '',
      amount: typeof ing?.amount === 'number' ? ing.amount : 0,
      amountType: ing?.amountType ?? 'g',
      note: ing?.note ?? '',
    }))
    recipes.value = [...recipes.value, parsed]
  } catch (e) {
    alert(t('Invalid JSON'))
  }
}

function cancelImportUrl() {
  importUrl.value = ''
  showImportUrlModal.value = false
}

function cancelImportJson() {
  importJsonText.value = ''
  showImportJsonModal.value = false
}

function parsePastedJson(input: string): any | null {
  const text = (input || '').trim()
  // Try to extract from fenced code block with 3 or 4 backticks
  const fenceMatch = text.match(/\n?`{3,4}json\s*\n([\s\S]*?)\n`{3,4}\s*$/i) || text.match(/\n?`{3,4}\s*\n([\s\S]*?)\n`{3,4}\s*$/)
  const jsonText = (fenceMatch ? fenceMatch[1] : text).trim()
  try {
    return JSON.parse(jsonText)
  } catch (_) {
    return null
  }
}

function exportAll() {
  try {
    const data = JSON.stringify(recipes.value, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const ts = new Date().toISOString().replace(/[:.]/g, '-')
    a.download = `recipes-${ts}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Export failed', e)
    alert(t('Export failed'))
  }
}

onMounted(() => {
  const shared = route.query.url
  if (typeof shared === 'string' && shared) {
    importUrl.value = shared
    showImportUrlModal.value = true
  }
})
</script>
