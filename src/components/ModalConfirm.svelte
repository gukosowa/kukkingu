{#if value}
  <div class="fixed w-screen h-screen bg-black top-0 left-0 z-40 opacity-50" />
  <div
    class="fixed w-screen w-full h-screen top-0 left-0 top-0 left-0 z-50"
    style="backdrop-filter: blur(1px);"
    on:click={clickNo}>
    <div class="w-full h-full px-12 pb-8 flex flex-col justify-end">
      <div class="w- bg-white p-5 rounded-xl drop-shadow">
        <div class="text-lg text-gray-600 font-bold">
          {$_('本当に削除')}？<br />
          <span class="text-sm">> {removeName}</span>
        </div>
        <div class="text-white text-center">
          <div
            class="cursor-pointer py-3 my-5 bg-red-500 rounded-lg drop-shadow"
            on:click={() => clickYes()}>
            {$_('はい')}
          </div>
          <div
            class="cursor-pointer py-3 bg-gray-500 rounded-lg drop-shadow"
            on:click={() => clickNo()}>
            {$_('キャンセル')}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<script>
  import { _ } from 'svelte-i18n'
  export let value = false
  export let removeName = ''
  import { createEventDispatcher } from 'svelte'

  const dispatch = new createEventDispatcher()

  function clickYes() {
    dispatch('confirm')
  }

  function clickNo() {
    dispatch('cancel')
  }

</script>

<style>
  .drop-shadow {
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))
      drop-shadow(0 1px 1px rgb(0 0 0 / 0.06));
  }

</style>
