<div class="flex-grow flex flex-col">
  <ModalConfirm
    bind:value={showDeleteConfirm}
    bind:removeName={deleteConfirmName}
    on:confirm={() => remove()}
    on:cancel={() => cancelRemove()} />
  <div class="text-left mb-2 flex items-baseline">
    <SInput
      class="flex-1 mx-2"
      bind:value={recipeName}
      on:enter={onCreateNew}
      useinit
      placeholder={$_('レシピ名')} />
    <Button class="ml-2 flex-shrink" on:click={onCreateNew}>
      {$_('作成')}
    </Button>
  </div>

  {#each $recipes as item, index (index)}
    <div
      transition:fly|local={{ delay: 0, duration: 200, x: 0, y: -30, opacity: 0, intro: false, easing: quintOut }}>
      <div class="flex items-baseline rounded-xl bg-gray-300 px-2 py-2 my-1">
        <div class="flex-grow pr-2">
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
        <div class="flex-grow whitespace-no-wrap text-right">
          {#if item.rename}
            <i
              on:click={() => moveDown(index)}
              class="text-sm cursor-pointer fal fa-arrow-down p-2 text-gray-600" />
            <i
              on:click={() => moveUp(index)}
              class="text-sm cursor-pointer fal fa-arrow-up p-2 text-gray-600" />

            <Button
              color="red"
              class="mr-1"
              tone={300}
              on:click={() => initRemove(index, item.name)}>
              <Icon icon="fal fa-trash-alt" size="1.2rem" />
            </Button>
            <Button color="green" tone={400} on:click={() => rename(index)}>
              <Icon icon="fal fa-check" size="1.2rem" />
            </Button>
          {:else}
            <Button color="gray" tone={400} on:click={() => initRename(index)}>
              <Icon icon="fal fa-pen" size="1.2rem" />
            </Button>
          {/if}
        </div>
      </div>
    </div>
  {/each}
  <Footer />
</div>

<script>
  import { _ } from 'svelte-i18n'
  import { fly } from 'svelte/transition'
  import { quintOut } from 'svelte/easing'
  import Footer from '~components/Footer.svelte'
  import { recipes } from '~src/store'
  import { push } from 'svelte-spa-router'
  import Button from './Button.svelte'
  import SInput from './Input.svelte'
  import { newRecipe } from '~plugins/helper'
  import Icon from './Icon.svelte'
  import ModalConfirm from './ModalConfirm.svelte'

  export let params = {}

  let recipeName = ''
  let showDeleteConfirm = false
  let deleteConfirmName = ''
  let deleteIndex = null

  function onCreateNew() {
    recipes.set(newRecipe(recipeName))
    recipeName = ''
  }

  function open(index) {
    push('/recipe/' + index)
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

  function initRemove(index, removeName) {
    showDeleteConfirm = true
    deleteConfirmName = removeName
    deleteIndex = index
  }

  function cancelRemove() {
    showDeleteConfirm = false
    deleteIndex = null
  }

  function remove() {
    $recipes.splice(deleteIndex, 1)
    recipes.set($recipes)

    cancelRemove()
  }

  function array_move(array, sourceIndex, destinationIndex) {
    const smallerIndex = Math.min(sourceIndex, destinationIndex)
    const largerIndex = Math.max(sourceIndex, destinationIndex)

    return [
      ...array.slice(0, smallerIndex),
      ...(sourceIndex < destinationIndex
        ? array.slice(smallerIndex + 1, largerIndex + 1)
        : []),
      array[sourceIndex],
      ...(sourceIndex > destinationIndex
        ? array.slice(smallerIndex, largerIndex)
        : []),
      ...array.slice(largerIndex + 1),
    ]
  }

  function moveUp(index) {
    const clamp = Math.max(0, index - 1)
    $recipes = array_move($recipes, index, clamp)
    recipes.set($recipes)
  }

  function moveDown(index) {
    const clamp = Math.min($recipes.length - 1, index + 1)
    $recipes = array_move($recipes, index, clamp)
    recipes.set($recipes)
  }

</script>
