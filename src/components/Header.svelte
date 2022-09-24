<header
  class="z-10 px-2 text-white h-16 bg-blue-600 fixed flex w-full items-center shadow-md border-b border-blue-700">
  <div class="w-full flex items-baseline">
    {#if !recipe}
      <div class="flex-grow">材料コンバーター</div>
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

    {#if !recipe}
      <Button class="shadow-none" on:click={() => showSignUp()}>登録</Button>
      <Button class="shadow-none" on:click={() => showSignIn()}>
        ログイン
      </Button>
    {/if}

    <BaseModal
      bind:value={showUserModal}
      textConfirm={confirmButtonText}
      textCancel="キャンセル"
      on:confirm={() => onConfirmUserModal()}
      on:cancel={() => hideSignUp()}>
      <div class="text-left mb-2 flex flex-col w-full items-baseline">
        <SInput
          class="flex-1 w-full mb-4"
          bind:value={inputEmail}
          type="email"
          on:enter={() => elPassword.focus()}
          useinit
          placeholder="E-Mail" />
        <SInput
          class="flex-1 w-full mb-4"
          bind:value={inputPassword}
          bind:elInput={elPassword}
          on:enter={onConfirmUserModal}
          useinit
          placeholder="Password" />
      </div>
    </BaseModal>
  </div>
</header>

<script>
  import BaseModal from '~components/BaseModal.svelte'
  import { fetchBackend } from '~plugins/helper.js'
  import { recipes, route, storeAuth, storedUser, storeUser } from '~src/store'
  import { push } from 'svelte-spa-router'

  let elDesire
  let recipe

  let elPassword

  let showUserModal = true

  let inputEmail = storedUser.email
  let inputPassword = storedUser.password
  let signLoginType = 'signup'
  let confirmButtonText = '登録'

  let recipeId = -1
  route.subscribe((r) => {
    recipeId = r.location?.startsWith('/recipe/') ? r.location.slice(8) : -1
  })

  $: recipe = recipeId !== -1 ? $recipes[recipeId] : null

  import SInput from '~components/Input.svelte'
  import Icon from './Icon.svelte'
  import Button from './Button.svelte'

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

  function showSignUp() {
    signLoginType = 'signup'
    confirmButtonText = '登録'
    showUserModal = true
  }

  function showSignIn() {
    signLoginType = 'signin'
    confirmButtonText = 'ログイン'
    showUserModal = true
  }

  function hideSignUp() {
    showUserModal = false
  }

  async function onConfirmUserModal() {
    const body = {
      email: inputEmail,
      password: inputPassword,
    }
    const res = await fetchBackend(signLoginType, body)

    storeUser.set(body)

    if (res.data.session) {
      delete res.data.session.user
      storeAuth.set(res.data.session)
    }

    console.log(res)
    console.log('do signup')

    hideSignUp()
  }

</script>
