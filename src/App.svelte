<div class="App h-screen flex flex-col">
  <Header index={openedRecipe} />
  <div class="mt-16 bg-gray-200 flex-grow p-4">
    {#if openedRecipe === -1}
      <Storage on:open={open} />
    {:else}
      <Recipe index={openedRecipe} on:home={open} />
    {/if}
  </div>
</div>

<script>
  import '~css/main.css'

  import Header from '~components/Header.svelte'
  import Storage from './components/Storage.svelte'

  import { onMount } from 'svelte'
  import { getStorage, syncStorage } from '~plugins/helper'
  import Recipe from './components/Recipe.svelte'

  let openedRecipe = -1
  $: openedRecipe = getStorage('openedRecipe', -1)

  function open(event) {
    console.log(event)
    openedRecipe = event.detail
    syncStorage('openedRecipe', openedRecipe)
  }

  let count = 0
  onMount(() => {
    const interval = setInterval(() => count++, 1000)
    return () => {
      clearInterval(interval)
    }
  })
</script>

<style>
</style>
