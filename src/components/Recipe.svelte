<div class="flex items-baseline">
  <Button on:click={back}>
    <Icon icon="fal fa-arrow-alt-left" size="1.2rem" />
  </Button>
  <div class="flex-1 px-5 text-lg font-bold text-gray-700">{recipe.name}</div>
  <Button color="yellow">
    <Icon icon="fal fa-broom" class="mr-1" size="1.2rem" />
    クリア
  </Button>
</div>
<div class="flex flex-col">
  <div class="my-3">
    <List
      class="grid grid-cols-3 mb-2 gap-4"
      let:index
      value={recipe.ingredients}>
      <SInput
        placeholder="材料"
        class=""
        bind:value={recipe.ingredients[index].name} />
      <SInput
        placeholder="分量"
        class=""
        bind:value={recipe.ingredients[index].amount} />
      <SInput
        placeholder=""
        class=""
        bind:value={recipe.ingredients[index].amountType} />
    </List>
    {#if recipe.ingredients}
      <div
        class="px-3 pb-3 pt-5 rounded-lg relative bg-gray-900 text-2xl text-white">
        <div class="absolute left-0 top-0 text-xs ml-3 mt-1">必要な量</div>
        {recipe.ingredients[index].name || '-'}
        {recipe.ingredients[index].amount / ratio || '0'}
        {recipe.ingredients[index].amountType}
      </div>
    {/if}
  </div>

  <div>
    <Button color="green">
      <Icon icon="fal fa-plus" class="mr-1" size="1.2rem" />
      追加
    </Button>
  </div>
</div>

<script>
  import { createEventDispatcher, onMount } from 'svelte'

  const dispatch = createEventDispatcher()
  import Button from './Button.svelte'
  import { getStorage, syncStorage } from '~plugins/helper'
  import SInput from './Input.svelte'
  import Icon from './Icon.svelte'
  import List from './List.svelte'

  export let index = -1

  let ratio = 1

  $: recipe = getStorage('recipes', [])[index] || {}
  $: ratio = +(recipe.original / recipe.desired)

  function back() {
    dispatch('home', -1)
  }

  onMount(() => {
    window.addEventListener('recipes', (e) => {
      console.log('chasngec', JSON.parse(e.detail))
      document.removeEventListener('recipes', fn)
    })
  })

  function amount(orig) {
    return orig * ratio()
  }

  function onchange() {
    const recipes = getStorage('recipes')
    recipes[index] = recipe
    syncStorage('recipes', recipes, [])
  }
</script>
