<div>
  <div class="text-left pb-4 flex items-baseline">
    Add new recipe:
    <SInput
      inputClass="w-full"
      class="flex-1 mx-2"
      bind:value={recipeName}
      on:enter={onCreateNew}
      useinit
      placeholder="name" />
    <Button class="ml-2" on:click={onCreateNew}>Create new</Button>
  </div>
  <List let:item let:index value={recipes}>
    <div
      class="w-full flex items-baseline rounded-xl bg-gray-300 py-3 px-3 my-2">
      <div>
        {#if item.rename}
          <SInput
            on:enter={rename(index)}
            autofocus
            value={item.name}
            on:input={(e) => changeName(e, index)} />
        {:else}
          <Button
            color="pink"
            on:click={open(index)}
            class="font-hairline text-lg leading-5 tracking-wider">
            {item.name}
          </Button>
        {/if}
      </div>
      <div class="flex-1 text-right">
        {#if item.rename}
          <Button
            class="mr-2"
            color="green"
            tone={400}
            on:click={rename(index)}>
            <Icon icon="fal fa-check" size="1.2rem" />
          </Button>
        {:else}
          <Button
            class="mr-2"
            color="gray"
            tone={400}
            on:click={initRename(index)}>
            <Icon icon="fal fa-pen" size="1.2rem" />
          </Button>
        {/if}
        <Button color="red" tone={300} on:click={remove(index)}>
          <Icon icon="fal fa-trash-alt" size="1.2rem" />
        </Button>
      </div>
    </div>
  </List>
</div>

<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  import Button from './Button.svelte'
  import SInput from './Input.svelte'
  import { getStorage, newRecipe, syncStorage } from '~plugins/helper'
  import List from './List.svelte'
  import Icon from './Icon.svelte'

  let recipeName = ''
  let recipes = []

  $: recipes = getStorage('recipes', [])

  function onCreateNew() {
    recipes = newRecipe(recipeName)
    recipeName = ''
  }

  function open(index) {
    dispatch('open', index)
  }

  function initRename(index) {
    recipes[index].rename = true
    recipes = syncStorage('recipes', recipes)
  }

  function changeName(event, index) {
    recipes[index].name = event.detail || ''
    recipes = syncStorage('recipes', recipes)
  }

  function rename(index) {
    if (!recipes[index].name) {
      recipes[index].name = '-'
    }
    delete recipes[index].rename
    recipes = syncStorage('recipes', recipes)
  }

  function remove(index) {
    console.log(index)
    recipes.splice(index, 1)
    recipes = syncStorage('recipes', recipes)
  }
</script>
