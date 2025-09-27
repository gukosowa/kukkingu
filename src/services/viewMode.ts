import { ref, computed } from 'vue'
import type { Recipe, WeeklyPlan, ShoppingListItem } from '~src/store/index'

// Global reactive state for "View Friend" mode
const isViewingFriend = ref(false)
const friendToken = ref<string>('')
const friendName = ref<string>('')

const friendRecipes = ref<Recipe[]>([])
const friendDailyPlans = ref<WeeklyPlan[]>([])
const friendShoppingLists = ref<Record<string, ShoppingListItem[]>>({})

// Track the in-flight fetch for friend data so we can abort when leaving view mode
let currentFriendFetchController: AbortController | null = null

function setFriendFetchController(controller: AbortController | null) {
  // Abort previous in-flight fetch if different
  if (currentFriendFetchController && currentFriendFetchController !== controller) {
    try { currentFriendFetchController.abort() } catch (_) {}
  }
  currentFriendFetchController = controller
}

function clearFriendFetchController(controller: AbortController) {
  if (currentFriendFetchController === controller) {
    currentFriendFetchController = null
  }
}

function abortFriendFetch() {
  if (currentFriendFetchController) {
    try { currentFriendFetchController.abort() } catch (_) {}
    currentFriendFetchController = null
  }
}

// Derived convenience accessors
const hasFriendData = computed(() => isViewingFriend.value && friendRecipes.value.length >= 0)

function enterViewMode(options: {
  token: string
  name?: string
  recipes?: Recipe[]
  dailyPlans?: WeeklyPlan[]
  shoppingLists?: Record<string, ShoppingListItem[]>
}) {
  friendToken.value = options.token
  friendName.value = (options.name || '').trim()
  friendRecipes.value = Array.isArray(options.recipes) ? options.recipes : []
  friendDailyPlans.value = Array.isArray(options.dailyPlans) ? options.dailyPlans : []
  friendShoppingLists.value = options.shoppingLists || {}
  isViewingFriend.value = true
}

function exitViewMode() {
  // Abort background refresh when leaving view mode
  abortFriendFetch()
  isViewingFriend.value = false
  friendToken.value = ''
  friendName.value = ''
  friendRecipes.value = []
  friendDailyPlans.value = []
  friendShoppingLists.value = {}
}

export {
  // state
  isViewingFriend,
  friendToken,
  friendName,
  friendRecipes,
  friendDailyPlans,
  friendShoppingLists,
  hasFriendData,
  // actions
  enterViewMode,
  exitViewMode,
  // fetch control
  setFriendFetchController,
  clearFriendFetchController,
  abortFriendFetch,
}
