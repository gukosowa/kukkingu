<header
  class="px-2 text-white h-16 bg-blue-600 fixed flex w-full items-center shadow-md border-b border-blue-700">
  <div class="w-full flex items-baseline">
    <div class="flex-grow">材料コンバーター</div>

    {#if !!recipe}
      <SInput
        class="w-20"
        disabled={!recipe.original}
        placeholder="必要量"
        type="number"
        on:input={onchange}
        bind:value={recipe.original} />
      <Icon
        class="mx-1"
        style="top: 3px;"
        size="1.6rem"
        icon="fal fa-play-circle" />
      <SInput
        class="w-20"
        disabled={!recipe.desired}
        placeholder="最低量"
        type="number"
        on:input={onchange}
        bind:value={recipe.desired} />
    {/if}
  </div>
</header>

<script>
  import { openedRecipe, recipes } from '~src/store'

  openedRecipe.subscribe((value) => {
    console.log('change ndex', value)
  })

  let recipe
  $: recipe = $recipes[$openedRecipe]

  import SInput from '~components/Input.svelte'
  import Icon from './Icon.svelte'

  function onchange() {
    $recipes[$openedRecipe] = recipe
    recipes.set($recipes)
  }
</script>
