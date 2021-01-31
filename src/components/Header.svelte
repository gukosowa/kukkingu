<header
  class="px-2 text-white h-16 bg-blue-600 fixed flex w-full items-center shadow-md border-b border-blue-700">
  <div>材料コンバーター</div>

  <div class="flex-1 text-right">
    {#if !!recipe}
      <SInput
        inputClass="w-20"
        disabled={!recipe.original}
        placeholder="必要量"
        type="number"
        on:input={onchange}
        bind:value={recipe.original} />
      <SInput
        inputClass="w-20"
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
  import { openedRecipe, recipes } from '~src/store'

  openedRecipe.subscribe((value) => {
    console.log('change ndex', value)
  })

  let recipe
  $: recipe = $recipes[$openedRecipe]

  import SInput from '~components/Input.svelte'

  function onchange() {
    $recipes[$openedRecipe] = recipe
    recipes.set($recipes)
  }
</script>
