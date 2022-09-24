{#if value}
  <div class="fixed w-screen h-screen bg-black top-0 left-0 z-40 opacity-50" />
  <div class="fixed  w-screen h-screen top-0 left-0 top-0 left-0 z-50">
    <div class="w-full h-full flex  flex-col justify-around">
      <div class="w- bg-gray-300 p-5">
        <slot />
        <div class="text-white text-center flex gap-4">
          <div
            class="cursor-pointer py-3 bg-gray-500 h-12 flex-1 rounded-lg"
            on:click={() => clickNo()}>
            {textCancel}
          </div>
          <div
            class="cursor-pointer py-3 flex-1 h-12 bg-green-500 rounded-lg"
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
  export let textConfirm = 'Ok'
  export let textCancel = 'Cancel'
  import { createEventDispatcher } from 'svelte'

  const dispatch = new createEventDispatcher()

  function clickYes() {
    dispatch('confirm')
  }

  function clickNo() {
    dispatch('cancel')
  }

</script>
