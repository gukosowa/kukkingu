{#if recipe}
  <div class="flex items-baseline">
    <Button on:click={() => openedRecipe.set(-1)}>
      <Icon icon="fal fa-arrow-alt-left" size="1.2rem" />
    </Button>
    <div class="flex-1 px-5 text-lg font-bold text-gray-700">
      {recipe?.name}
    </div>
    <Button color="yellow">
      <Icon icon="fal fa-broom" class="mr-1" size="1.2rem" />
      クリア
    </Button>
  </div>
  <div class="flex flex-col">
    <div class="my-3">
      {#each recipe.ingredients as item, index}
        <div class="grid grid-cols-12 mb-2 gap-1" value={recipe.ingredients}>
          <SInput
            placeholder="材料"
            class="col-span-6"
            bind:value={item.name} />
          <SInput
            placeholder="分量"
            class="col-span-3"
            bind:value={item.amount} />
          <label class="col-span-3"><select
              name="amountType"
              class="focus:ring-indigo-500 w-full text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md"
              bind:value={item.amountType}>
              <option value="g">g</option>
              <option value="㏄">㏄</option>
              <option value="大さじ">大さじ</option>
              <option value="小さじ">小さじ</option>
              <option value="個">個</option>
            </select>
          </label>
          <div
            class="col-span-12 px-3 pb-3 pt-5 rounded-lg relative bg-gray-900 text-2xl text-white">
            <div class="grid grid-cols-12">
              <div class="col-span-10">
                <div class="absolute left-0 top-0 text-xs ml-3 mt-1">
                  必要な量
                </div>
                <span class="font-bold">{item.name || '-'}</span>
                {#if ['大さじ', '小さじ'].includes(item.amountType)}
                  <span style="font-size: 1.2rem;">{item.amountType}</span>
                {/if}
                <span class="font-bold">{amount(item)}</span>
                {#if !['大さじ', '小さじ'].includes(item.amountType)}
                  <span style="font-size: 1.2rem;">{item.amountType}</span>
                {/if}
              </div>
              <div class="col-span-2 relative text-right">
                <i
                  on:click={() => doOriginal(index)}
                  class="fal fa-tape p-2 top-0 -mt-1 mr-10 absolute right-0 text-gray-600" />
                <i
                  on:click={() => deleteIngredient(index)}
                  class="fal fa-minus-circle p-2 top-0 -mt-1 absolute right-0 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
    <div>
      <Button on:click={addIngredient} color="green">
        <Icon icon="fal fa-plus" class="mr-1" size="1.2rem" />
        追加
      </Button>
    </div>
  </div>
{/if}

<script>
  import { openedRecipe } from '~src/store'
  import { recipes } from '~src/store'

  if (!$recipes || $recipes.length === 0) {
    openedRecipe.set(-1)
  }

  let ratio
  $: ratio = recipe.original / recipe.desired

  let recipe
  $: recipe = $openedRecipe !== -1 ? $recipes[$openedRecipe] : null

  import Button from './Button.svelte'
  import SInput from './Input.svelte'
  import Icon from './Icon.svelte'
  import { newIngredient } from '~plugins/helper'

  function addIngredient() {
    $recipes[$openedRecipe].ingredients.push(newIngredient())
    recipes.set($recipes)
  }

  function amount(item) {
    const rat = ratio || 1
    return parseFloat((item.amount / rat).toFixed(2)) || '0'
  }

  function doOriginal(index) {
    recipes.update((r) => {
      r[$openedRecipe].original = r[$openedRecipe].ingredients[index].amount
      r[$openedRecipe].desired = r[$openedRecipe].ingredients[index].amount
      return r
    })
  }

  function deleteIngredient(index) {
    recipes.update((r) => {
      r[$openedRecipe].ingredients.splice(index, 1)
      return r
    })
  }
</script>
