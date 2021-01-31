<div>
  <div class="text-left pb-4 flex items-baseline">
    <SInput
      class="flex-1 mx-2"
      bind:value={recipeName}
      on:enter={onCreateNew}
      useinit
      placeholder="Name of recipe" />
    <Button class="ml-2 flex-shrink" on:click={onCreateNew}>作成</Button>
  </div>

  {#each $recipes as item, index}
    <div>
      <div class="flex items-baseline rounded-xl bg-gray-300 py-2 px-2 my-2">
        <div class="flex-grow">
          {#if item.rename}
            <SInput
              on:enter={() => rename(index)}
              autofocus
              value={item.name}
              on:input={(e) => changeName(e, index)} />
          {:else}
            <Button
              color="pink"
              on:click={() => open(index)}
              class="font-hairline text-lg leading-5 tracking-wider">
              {item.name}
            </Button>
          {/if}
        </div>
        <div class="flex-grow text-right">
          {#if item.rename}
            <Button color="green" tone={400} on:click={() => rename(index)}>
              <Icon icon="fal fa-check" size="1.2rem" />
            </Button>
          {:else}
            <Button color="gray" tone={400} on:click={() => initRename(index)}>
              <Icon icon="fal fa-pen" size="1.2rem" />
            </Button>
          {/if}
          <Button color="red" tone={300} on:click={() => remove(index)}>
            <Icon icon="fal fa-trash-alt" size="1.2rem" />
          </Button>
        </div>
      </div>
    </div>
  {/each}
</div>

<script>
  import { openedRecipe, recipes } from '~src/store'
  import Button from './Button.svelte'
  import SInput from './Input.svelte'
  import { newRecipe } from '~plugins/helper'
  import Icon from './Icon.svelte'

  let recipeName = ''

  function onCreateNew() {
    recipes.set(newRecipe(recipeName))
    recipeName = ''
  }

  function open(index) {
    openedRecipe.set(index)
  }

  function initRename(index) {
    $recipes[index].rename = true
    recipes.set($recipes)
  }

  function changeName(event, index) {
    $recipes[index].name = event.detail || ''
    recipes.set($recipes)
  }

  function rename(index) {
    if (!$recipes[index].name) {
      $recipes[index].name = '-'
    }
    delete $recipes[index].rename
    recipes.set($recipes)
  }

  function remove(index) {
    $recipes.splice(index, 1)
    recipes.set($recipes)
  }
</script>
