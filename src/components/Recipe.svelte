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
      {#each recipe.ingredients as item, i}
        <div class="grid grid-cols-6 mb-2 gap-1" value={recipe.ingredients}>
          <SInput
            placeholder="材料"
            class="col-span-3"
            bind:value={item.name} />
          <SInput
            placeholder="分量"
            class="col-span-2"
            bind:value={item.amount} />
          <SInput
            placeholder=""
            class="col-span-1"
            bind:value={item.amountType} />

          <div
            class="col-span-6 px-3 pb-3 pt-5 rounded-lg relative bg-gray-900 text-2xl text-white">
            <div class="absolute left-0 top-0 text-xs ml-3 mt-1">必要な量</div>
            {item.name || '-'}
            {item.amount / 1 || '0'}
            {item.amountType}
          </div>
        </div>
      {/each}
    </div>
    <div>
      <Button color="green">
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

  console.log($recipes)

  let recipe = []
  $: recipe = $openedRecipe !== -1 ? $recipes[$openedRecipe] : null

  import Button from './Button.svelte'
  import SInput from './Input.svelte'
  import Icon from './Icon.svelte'
</script>
