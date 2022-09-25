<header
  class="z-10 px-2 text-white h-16 bg-blue-600 fixed flex w-full items-center shadow-md border-b border-blue-700">
  <div class="w-full flex items-baseline">
    {#if !recipe}
      <div class="flex-grow flex">
        <div class="flex-grow self-center">材料コンバーター</div>
        <div class="flex-shrink">
          {#await userPromise}
            <Icon icon="fal fa-sync fa-spin mr-4" size="1.2rem" />
          {:then user}
            {#if !!user}
              <Button class="shadow-none" on:click={() => logout()}>
                {#if $didSynced}
                  <Icon icon="fal fa-sync fa-spin" size="1.2rem" />
                {:else}
                  <Icon icon="fal fa-sign-out" size="1.2rem" />
                {/if}
              </Button>
            {:else}
              <Button class="shadow-none" on:click={() => loginWithRedirect()}>
                <Icon icon="fal fa-cloud-upload" size="1.2rem" />
              </Button>
            {/if}
          {/await}
        </div>
      </div>
    {:else}
      <div class="flex-grow">
        <Button class="shadow-none" on:click={() => home()}>
          <Icon icon="fal fa-arrow-alt-left" size="1.2rem" />
        </Button>
      </div>
    {/if}

    {#if !!recipe}
      <SInput
        class="w-20"
        placeholder="必要量"
        type="number"
        on:enter={focusNext}
        on:input={onchange}
        bind:value={recipe.original} />
      <Icon
        class="mx-1"
        style="top: 3px;"
        size="1.6rem"
        icon="fal fa-play-circle" />
      <SInput
        class="w-20"
        placeholder="最低量"
        type="number"
        id="input-desired"
        bind:elInput={elDesire}
        on:enter={blur}
        on:input={onchange}
        bind:value={recipe.desired} />
    {/if}
  </div>
</header>

<script>
  import { loginWithRedirect, logout } from 'thin-backend'
  import { userPromise } from '~src'
  import { recipes, route } from '~src/store'
  import { push } from 'svelte-spa-router'

  let elDesire
  let recipe

  let recipeId = -1
  route.subscribe((r) => {
    recipeId = r.location?.startsWith('/recipe/') ? r.location.slice(8) : -1
  })

  $: recipe = recipeId !== -1 ? $recipes[recipeId] : null

  import SInput from '~components/Input.svelte'
  import { didSynced } from '~src/store/index.js'
  import Icon from './Icon.svelte'
  import Button from './Button.svelte'

  userPromise.then(console.log)

  function onchange() {
    $recipes[recipeId] = recipe
    recipes.set($recipes)
  }

  function focusNext() {
    elDesire.focus()
  }

  function blur(ev) {
    ev.detail.el.blur()
  }

  function home() {
    push('/')
  }

</script>
