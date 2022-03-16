{#if value}
  <div class="fixed w-screen h-screen bg-black top-0 left-0 z-40 opacity-50" />
  <div class="fixed  w-screen h-screen top-0 left-0 top-0 left-0 z-50">
    <div class="w-full h-full flex flex-col justify-around">
      <div class="bg-gray-400 p-5">
        <slot />
        <div class="text-white flex gap-3 text-center">
          <div
            class="cursor-pointer flex-grow py-3 bg-red-500 rounded-lg"
            on:click={() => clickNo()}>
            {textCancel}
          </div>
          <div
            class="cursor-pointer flex-grow py-3 bg-green-600 rounded-lg"
            on:click={() => clickYes()}>
            {textConfirm}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<script>
  export let value = false
  import { createEventDispatcher } from 'svelte'

  export let textConfirm = 'Confirm'
  export let textCancel = 'Cancel'

  const dispatch = new createEventDispatcher()

  function clickYes() {
    dispatch('confirm')
  }

  function clickNo() {
    dispatch('cancel')
  }
</script>
