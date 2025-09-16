<template>
  <header class="z-20 px-2 text-white h-16 bg-blue-600 fixed flex w-full items-center shadow-md border-b border-blue-700">
    <div class="w-full flex items-center">
      <template v-if="!recipe">
        <div class="flex-grow flex items-center">
          <img
            src="/android-chrome-192x192.png"
            alt="Kukkingu"
            class="h-12 w-12 select-none cursor-pointer"
            draggable="false"
            @click="goToOverview"
          />
        </div>
      </template>
      <template v-else>
        <div class="flex-grow flex items-center">
          <Button class="shadow-none" @click="home">
            <Icon icon="fal fa-arrow-alt-left" size="1.2rem" />
          </Button>
          <div class="recipe-title flex-1 mr-2 text-xs font-bold leading-tight overflow-hidden">
            {{ recipe?.name }}
          </div>
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
        <Icon class="mx-1" size="1.6rem" icon="fal fa-play-circle cursor-pointer px-1" @click="recipe.desired = recipe.original" />
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
      <template v-else>
        <Button @click="openPlanner" class="mr-2">
          <Icon icon="fal fa-calendar-week mr-2" size="1rem" />
          {{ t('Planner') }}
        </Button>
        <Button @click="openImportUrl" class="mr-2">
          <Icon icon="fal fa-magic mr-2" size="1rem" />
          {{ t('GPT') }}
        </Button>
      </template>
    </div>
    <ModalUrlText
      v-model="showImportUrlModal"
      :url="importUrl"
      :text="importText"
      :fromPicture="importFromPicture"
      :title="t('JSON from URL')"
      :confirmText="t('Open GPT')"
      :placeholderUrl="t('https://example.com')"
      :placeholderText="t('Recipe text')"
      @confirm="confirmImportUrl"
      @cancel="cancelImportUrl"
    />
    <ModalNotice
      v-model="showNotice"
      :title="noticeTitle"
      :message="noticeMessage"
      :icon="noticeIcon"
      :okText="noticeOkText"
      @ok="handleNoticeOk"
    />
  </header>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { recipes, modalStates } from '~src/store/index'
import { t, currentLocale } from '~src/i18n'
import SInput from '~components/Input.vue'
import Icon from './Icon.vue'
import Button from './Button.vue'
import ModalUrlText from './ModalUrlText.vue'
import ModalNotice from './ModalNotice.vue'
import { buildImportRecipePrompt } from '~src/services/prompt'
import { openChatGPT } from '~src/services/chatgpt'
import { handlePromptNoticeOk } from '~src/services/notice'

const route = useRoute()
const router = useRouter()

// GPT modal state
let showImportUrlModal = ref(false)
let importUrl = ref('')
let importText = ref('')
let importFromPicture = ref(false)
let showNotice = ref(false)
let noticeTitle = ref('')
let noticeMessage = ref('')
let noticeIcon = ref('fal fa-info-circle')
let noticeOkText = ref(t('Got it'))
let noticeOkUrl = ref<string | null>(null)

const recipeId = computed(() => {
  if (route.path.startsWith('/recipe/')) {
    return route.params.recipeId as string
  }
  return null
})

const recipeIndex = computed(() => {
  return recipeId.value ? recipes.value.findIndex(recipe => recipe.id === recipeId.value) : -1
})

const recipe = computed<any>({
  get() {
    return recipeIndex.value !== -1 ? recipes.value[recipeIndex.value] : null
  },
  set(v) {
    if (recipeIndex.value !== -1) {
      const copy = [...recipes.value]
      copy[recipeIndex.value] = v
      recipes.value = copy
    }
  },
})

function onchange() {
  if (recipeIndex.value !== -1) {
    const copy = [...recipes.value]
    copy[recipeIndex.value] = recipe.value
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

function goToOverview() {
  router.push('/')
}

function openPlanner() {
  router.push('/planner')
}

// GPT functionality functions
function openImportUrl() {
  importUrl.value = ''
  importFromPicture.value = false
  showImportUrlModal.value = true
}

async function confirmImportUrl(payload: { url: string; text: string; fromPicture: boolean }) {
  importUrl.value = payload.url
  importText.value = payload.text
  importFromPicture.value = payload.fromPicture
  showImportUrlModal.value = false

  const locale = currentLocale.value === 'jp' ? 'Japanese' : currentLocale.value === 'de' ? 'German' : 'English'
  const prompt = buildImportRecipePrompt({
    url: importUrl.value,
    text: importText.value,
    locale,
    fromPicture: importFromPicture.value,
  })

  const url = importUrl.value || ''
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')

  if (isYouTube) {
    // YouTube flow: always copy + guide to Gemini
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
      t('We copied the prompt to your clipboard. We are using Gemini because YouTube extraction only works with Gemini. Paste the prompt and send it.'),
      'fal fa-magic',
      t('Goto Gemini'),
      'https://gemini.google.com/'
    )
  } else {
    // Non-YouTube: if prompt fits ?q=, open ChatGPT directly; otherwise fall back to copy + notice
    const copied = await openChatGPT(prompt)
    if (copied) {
      showAppNotice(
        t('Prompt ready'),
        t('We copied the prompt to your clipboard. Paste the prompt and send it.'),
        'fal fa-comments',
        t('Goto ChatGPT'),
        'https://chatgpt.com/'
      )
    }
  }

  // After opening GPT/Gemini, clear inputs so next open starts fresh
  importUrl.value = ''
  importText.value = ''
  importFromPicture.value = false
}

function cancelImportUrl() {
  importUrl.value = ''
  importText.value = ''
  importFromPicture.value = false
  showImportUrlModal.value = false
}

function showAppNotice(title: string, message: string, icon?: string, okText?: string, okUrl?: string | null) {
  noticeTitle.value = title
  noticeMessage.value = message
  noticeIcon.value = icon || 'fal fa-info-circle'
  noticeOkText.value = okText || t('Got it')
  noticeOkUrl.value = okUrl || null
  showNotice.value = true
}

function handleNoticeOk() {
  handlePromptNoticeOk(noticeOkUrl.value, () => {
    // Open import JSON modal after going to ChatGPT
    modalStates.value.showImportJson = true
  })
}

// Legacy clipboard copy using document.execCommand('copy') for wider compatibility
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
  } catch (e) {
    // Best-effort fallback: leave text selected for manual copy
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.focus()
      textarea.select()
    } catch (_) {
      // no-op
    }
  }
}
</script>

<style scoped>
.recipe-title {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
