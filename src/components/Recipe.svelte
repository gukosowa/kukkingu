{#if recipe}
  <div class="flex items-center my-1">
    <div
      class="title flex-1 whitespace-no-wrap overflow-hidden text-xs px-1 font-bold text-gray-700">
      {recipe?.name}
    </div>

    {#if !recipe.checklist}
      <Button on:click={switchEdit} class="mr-1" color="green">
        {#if recipe.edit}
          <Icon icon="fal fa-eye" class="mr-1" size="0.8rem" />
          {$_('表示モード')}
        {:else}
          <Icon icon="fal fa-pen" class="mr-1" size="0.8rem" />
          {$_('編集モード')}
        {/if}
      </Button>
    {:else}
      <Button on:click={clearCheck} class="mr-1" color="gray">
        <Icon icon="fal fa-broom" class="mr-1" size="0.8rem" />
        {$_('クリア')}
      </Button>
    {/if}
    {#if !recipe.edit}
      <Button on:click={switchCheck} color="gray">
        {#if recipe.checklist}
          <Icon icon="fal fa-eye" class="mr-1" size="0.8rem" />
          {$_('表示モード')}
        {:else}
          <Icon icon="fal fa-shopping-cart" class="mr-1" size="0.8rem" />
          {$_('チェックリスト')}
        {/if}
      </Button>
    {/if}
  </div>
  <div class="flex flex-col">
    <div class="mb-3 mt-2">
      {#each recipe.ingredients as item, index (index)}
        <div class="grid grid-cols-12 mb-3 gap-1" value={recipe.ingredients}>
          {#if recipe.edit}
            <SInput
              placeholder={$_('材料')}
              class="col-span-6"
              inputClass="input-field"
              id="input-name-{index}"
              on:enter={focusNext}
              on:update={saveChange}
              bind:value={item.name} />
            <SInput
              placeholder={$_('分量')}
              class="col-span-3"
              inputClass="input-field"
              type="number"
              id="input-amount-{index}"
              on:update={saveChange}
              on:enter={focusNext}
              bind:value={item.amount} />
            <AmountTypeModal
              bind:this={item._inputAmountType}
              class="col-span-3"
              on:update={saveChange}
              bind:value={item.amountType} />
          {/if}
          <div
            transition:fly|local={{ delay: 0, duration: 200, x: 0, y: -30, opacity: 0, intro: false, easing: quintOut }}
            class="col-span-12 px-3 pb-3 pt-5 rounded-lg relative bg-gray-900 text-2xl text-white">
            <div class="grid grid-cols-12">
              <div class="col-span-10">
                <div
                  class="absolute left-0 text-gray-600 top-0 text-xs ml-3 mt-1">
                  {$_('必要な量')}
                </div>
                <span
                  class="text-gray-300 font-bold"
                  on:click={() => clickName(index)}>{item.name || '-'}</span>
                {#if ['大さじ', '小さじ'].includes(item.amountType)}
                  <span
                    class="text-red-300"
                    on:click={() => clickAmountType(item._inputAmountType)}
                    style="font-size: 1.2rem;">{$_('full_' + item.amountType)}</span>
                {/if}
                <span
                  class="font-bold"
                  on:click={() => clickAmount(index)}>{amount(item, item.amountType)}</span>
                {#if !['大さじ', '小さじ'].includes(item.amountType)}
                  <span
                    class="text-red-300"
                    on:click={() => clickAmountType(item._inputAmountType)}
                    style="font-size: 1.2rem;">{$_('full_' + item.amountType)}</span>
                {/if}
              </div>
              <div class="col-span-2 relative text-right">
                {#if recipe.checklist}
                  <Checkbox
                    class="absolute right-0 top-0 -mt-1"
                    bind:value={item.checked}
                    on:input={saveChange} />
                {:else if !recipe.edit}
                  <div
                    class="text-xs whitespace-no-wrap absolute top-0 -mt-4 right-0 text-gray-500">
                    <span class="text-gray-700">{$_('オリジナル')} </span>
                    {item.amount || '0'}
                  </div>
                  <i
                    on:click={() => doOriginal(index)}
                    class="cursor-pointer fal fa-ruler p-2 top-0 -mt-1 {recipe.edit ? 'mr-10' : ''} absolute right-0 text-gray-600" />
                {/if}
                {#if recipe.edit}
                  <i
                    on:click={() => moveDown(index)}
                    class="text-sm cursor-pointer fal fa-arrow-down p-2 top-0 mr-24 absolute right-0 text-gray-600" />
                  <i
                    on:click={() => moveUp(index)}
                    class="text-sm cursor-pointer fal fa-arrow-up p-2 top-0 mr-16 absolute right-0 text-gray-600" />
                  <i
                    on:click={() => deleteIngredient(index)}
                    class="cursor-pointer fal fa-minus-circle p-2 top-0 -mt-1 absolute right-0 text-gray-600" />
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
    <div class="mb-4 mt-2 text-right">
      {#if recipe.edit}
        <Button on:click={addIngredient} color="green">
          <Icon icon="fal fa-plus" class="mr-1" size="1.2rem" />
          {$_('追加')}
        </Button>
      {/if}
    </div>
    <div class="flex mt-4">
      {#if recipe.edit}
        <SInput
          placeholder={$_('レシピのURL')}
          class="flex-grow"
          on:update={saveChange}
          on:input={() => ($recipes[recipeId].url = recipe.url)}
          bind:value={recipe.url} />
      {/if}
      {#if recipe.url}
        <a href={recipe.url} class="ml-2" target="_blank" rel="noreferrer">
          <Button class="whitespace-no-wrap">
            {$_('レシピのウェブページを開く')}
            <i class="fal fa-external-link ml-2" />
          </Button></a>
      {/if}
    </div>
    <div>
      {#if recipe.edit}
        <textarea
          placeholder={$_('ノート')}
          style="height: 200px;"
          class="mt-2 w-full focus:ring-indigo-500 text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md"
          on:input={saveChange}
          bind:value={recipe.note}
          on:input={() => ($recipes[recipeId].note = recipe.note)} />
      {:else if recipe.note}
        <p class="text-sm mt-3 px-2"><b>{$_('ノート')}:</b></p>
        <p class="markdown-body text-sm whitespace-pre-wrap px-2">
          {@html markedRender}
        </p>
      {/if}
    </div>
  </div>
  <Footer />
{/if}

<script>
  import { onMount } from 'svelte'
  import * as marked from 'marked'
  import { _ } from 'svelte-i18n'
  import { fly } from 'svelte/transition'
  import { quintOut } from 'svelte/easing'
  import Footer from '~components/Footer.svelte'
  import { recipes } from '~src/store'
  import { location, push } from 'svelte-spa-router'

  export let params = {}

  if (!$recipes || $recipes.length === 0) {
    push('/')
  }

  let recipeId = params.id

  $: recipeId = params.id

  let markedRender
  $: markedRender = marked.parse(recipe.note)

  let recipe

  location.subscribe(() => {
    recipeId = params.id
    recipe = recipeId !== -1 ? $recipes[recipeId] : null
  })

  let ratio
  $: ratio = recipe && recipe.original / recipe.desired

  $: recipe = recipeId !== -1 ? $recipes[recipeId] : null

  import Button from './Button.svelte'
  import SInput from './Input.svelte'
  import Icon from './Icon.svelte'
  import { newIngredient } from '~plugins/helper'
  import Checkbox from './Checkbox.svelte'
  import AmountTypeModal from './AmountTypeModal.svelte'

  onMount(() => {
    if ($recipes[recipeId]) {
      $recipes[recipeId].edit = false
    }
    recipes.set($recipes)
  })

  function clickName(index) {
    document.getElementById('input-name-' + index)?.focus()
  }

  function clickAmount(index) {
    document.getElementById('input-amount-' + index)?.focus()
  }

  function clickAmountType(item) {
    item?.focus()
  }

  function addIngredient() {
    $recipes[recipeId].ingredients.push(newIngredient())
    recipes.set($recipes)
    setTimeout(() => {
      let items = [...document.getElementsByClassName('input-field')]
      items[items.length - 2].focus()
    }, 0)
  }

  function switchEdit() {
    $recipes[recipeId].edit = !$recipes[recipeId].edit
    $recipes[recipeId].checklist = false
    recipes.set($recipes)
  }

  function switchCheck() {
    $recipes[recipeId].checklist = !$recipes[recipeId].checklist
    $recipes[recipeId].edit = false
    recipes.set($recipes)
  }

  function clearCheck() {
    $recipes[recipeId].ingredients.forEach((i) => {
      i.checked = false
    })

    $recipes[recipeId].edit = false
    recipes.set($recipes)
  }

  function saveChange() {
    setTimeout(() => {
      recipes.set($recipes)
    }, 0)
  }

  function focusNext() {
    const current = document.activeElement
    let items = [...document.getElementsByClassName('input-field')]
    const currentIndex = items.indexOf(current)
    let newIndex

    if (currentIndex === -1) {
      newIndex = 0
    } else {
      newIndex = currentIndex + 1
    }
    current.blur()
    if (newIndex >= items.length) {
      addIngredient()
      setTimeout(() => {
        items = [...document.getElementsByClassName('input-field')]
        items[items.length - 2].focus()
      }, 0)
    }
    if (items[newIndex]) {
      items[newIndex].focus()
    }
  }

  function amount(item, amountType) {
    let useQuarter
    const rat = ratio || 1

    switch (amountType) {
      case '少々':
        return Math.ceil(item.amount / rat).toFixed(0)
      case 'g':
      case '㏄':
        if (item.amount > 1) {
          return Math.round(item.amount / rat)
        }
        break
      case '大さじ':
      case '小さじ':
      case '個':
        useQuarter = true
        break
      default:
        useQuarter = false
    }
    if (useQuarter) {
      let amount = (Math.round((item.amount / rat) * 4) / 4).toFixed(2)
      if (amount.includes('.')) {
        let [number, decimal] = amount.split('.')

        if (decimal) {
          number = +number === 0 ? '' : number
        }
        switch (decimal) {
          case '25':
            amount = number + ' ' + '¼'
            break
          case '50':
            amount = number + ' ' + '½'
            break
          case '75':
            amount = number + ' ' + '¾'
            break
          default:
            amount = number
        }
      }
      return !amount ? 0 : amount
    }

    return parseFloat((item.amount / rat).toFixed(2)) || '0'
  }

  function doOriginal(index) {
    recipes.update((r) => {
      r[recipeId].original = r[recipeId].ingredients[index].amount
      r[recipeId].desired = r[recipeId].ingredients[index].amount
      return r
    })
    document.getElementById('input-desired')?.focus()
    setTimeout(() => {
      document.getElementById('input-desired')?.select()
    }, 0)
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
    recipes.update((r) => {
      const clamp = Math.max(0, index - 1)
      r[recipeId].ingredients = array_move(
        r[recipeId].ingredients,
        index,
        clamp
      )
      return r
    })
  }

  function moveDown(index) {
    recipes.update((r) => {
      const clamp = Math.min(r[recipeId].ingredients.length - 1, index + 1)
      r[recipeId].ingredients = array_move(
        r[recipeId].ingredients,
        index,
        clamp
      )
      return r
    })
  }

  function deleteIngredient(index) {
    recipes.update((r) => {
      r[recipeId].ingredients = r[recipeId].ingredients.filter(
        (a, i) => i !== index
      )
      return r
    })
  }

</script>

<style>
  @import 'github-markdown-css';
  .title {
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .markdown-body {
    background: initial;
    box-sizing: border-box;
    min-width: 200px;
    max-width: 980px;
    margin: 0 auto;
    padding: 45px;
  }

  @media (max-width: 767px) {
    .markdown-body {
      padding: 15px;
    }
  }

</style>
