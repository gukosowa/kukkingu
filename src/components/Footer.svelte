<ModalConfirm
  bind:value={showDeleteConfirm}
  bind:removeName={deleteConfirmName}
  on:confirm={() => clearAll()}
  on:cancel={() => cancelClearAll()} />

<footer
  class="z-10 flex-grow px-2 mt-8 text-gray-500 text-sm flex w-full items-end ">
  <div class="h-8 flex items-center w-full">
    <div class="w-full text-xs flex items-baseline">
      <div class="flex-grow flex">
        <div class="flex-grow self-center">
          <a class="" href="/privacy-statement.txt">Privacy Policy</a>
          <div class="mt-1 mb-2" on:click={initClearAll}>
            {$_('clear_all_data')}
          </div>
        </div>

        <div class="flex-shrink">
          {#await userPromise}
            <Icon icon="fal fa-sync fa-spin mr-4" size="1.2rem" />
          {:then user}
            {#if !!user}<span>{$_('username')}: {user.email}</span><br />{/if}
          {/await}
          <div class="text-sm text-right" on:click={changeLocale}>
            <i class="fas fa-globe mr-1" />

            JP
            <i
              class="fas fa-toggle-on"
              class:fa-rotate-180={$currentLocale === 'jp'} />
            EN
          </div>
        </div>
      </div>
    </div>
  </div>
</footer>

<script>
  import { onMount } from 'svelte'
  import { _, locale } from 'svelte-i18n'
  import ModalConfirm from '~components/ModalConfirm.svelte'
  import { userPromise } from '~src'
  import { currentLocale, recipes } from '~src/store/index.js'
  import Icon from './Icon.svelte'

  let showDeleteConfirm = false
  let deleteConfirmName = $_('clear_all')

  onMount(() => {
    const storedLocale = localStorage.getItem('locale') || 'jp'
    locale.set(storedLocale)
  })

  function initClearAll() {
    showDeleteConfirm = true
  }

  function clearAll() {
    recipes.set([])
  }

  function cancelClearAll() {
    showDeleteConfirm = false
  }

  function changeLocale() {
    let setLocale = $currentLocale === 'jp' ? 'en' : 'jp'
    currentLocale.set(setLocale)

    locale.set(setLocale)
    localStorage.setItem('locale', setLocale)
  }

</script>
