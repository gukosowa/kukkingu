<header
  class="z-10 px-2 text-white h-16 bg-blue-600 fixed flex w-full items-center shadow-md border-b border-blue-700">
  <div class="w-full flex items-baseline">
    {#if !recipe}
      <div class="flex-grow">材料コンバーター</div>

      <Button on:click={onShowRegister} class="mr-2">Register</Button>
      <Button on:click={onShowLogin} >Login</Button>

      <BaseModal 
        bind:value={showUserModal}
        on:confirm={() => onUserModalConfirm()}
        on:cancel={() => onUserModalCancel()} 
      >
      <div class="flex">
        <Icon
        class="mx-1"
        style="top: 3px;"
        size="1.6rem"
        icon="fal fa-at" />
        <SInput
        class="flex-grow"
          placeholder="Email"
          id="input-desired"
          on:enter={blur}
          on:input={onchange}
          bind:value={inputEmail} />
      </div>
      <div class="flex mt-3 mb-4">
        <Icon
        class="mx-1"
        style="top: 3px;"
        size="1.6rem"
        icon="fal fa-key" />
        <SInput
        class="flex-grow"
          placeholder="Email"
          id="input-desired"
          on:enter={blur}
          on:input={onchange}
          bind:value={inputPassword} />
      </div>
      </BaseModal>
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
  import { recipes, route } from '~src/store'
  import { push } from 'svelte-spa-router'

  let showUserModal = false
  let elDesire
  let recipe

  let inputEmail = 'marcus.lechner@gmail.com'
  let inputPassword = '123456'
  let userEndpoint = 'register'

  let recipeId = -1
  route.subscribe((r) => {
    recipeId = r.location?.startsWith('/recipe/') ? r.location.slice(8) : -1
  })

  $: recipe = recipeId !== -1 ? $recipes[recipeId] : null

  import SInput from '~components/Input.svelte'
  import Icon from './Icon.svelte'
  import Button from './Button.svelte'
  import BaseModal from './BaseModal.svelte'
import { endpointUser } from '../plugins/helper';

  function onShowRegister() {
    showUserModal = true
    userEndpoint = 'register'
  }
  function onShowLogin() {
    showUserModal = true
    userEndpoint = 'login'
  }

  function onUserModalConfirm() {
    return endpointUser(userEndpoint, {
        email: inputEmail,
        password: inputPassword
      })
    console.log(1)
  }

  function onUserModalCancel() {
    console.log(2)
    showUserModal = false
  }

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
