<header
  class="px-2 text-white h-16 bg-blue-600 fixed flex w-full items-center shadow-md border-b border-blue-700">
  <div>材料コンバーター</div>

  <div class="flex-1 text-right">
    {#if !!recipe}
      <SInput
        disabled={!recipe.original}
        placeholder="必要量"
        type="number"
        on:input={onchange}
        bind:value={recipe.original} />
      <SInput
        disabled={!recipe.desired}
        icon="fal fa-play-circle"
        placeholder="最低量"
        type="number"
        on:input={onchange}
        bind:value={recipe.desired} />
    {/if}
  </div>
</header>

<script>
  import SInput from '~components/Input.svelte'
  import { getStorage, syncStorage } from '~plugins/helper'

  export let index = -1
  $: recipe = getStorage('recipes', [])[index] || {}

  $: valueOriginal = syncStorage('h-original', valueOriginal, 100)
  $: valueDesired = syncStorage('h-desired', valueDesired, 100)

  let valueOriginal = null
  let valueDesired = null

  function onchange() {
    const recipes = getStorage('recipes')
    recipes[index] = recipe
    syncStorage('recipes', recipes, [])
  }
</script>
