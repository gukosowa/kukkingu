{#if value}
  <div class="fixed w-screen h-screen bg-black top-0 left-0 z-40 opacity-50" />
  <div class="fixed  w-screen h-screen top-0 left-0 top-0 left-0 z-50">
    <div class="w-full h-full flex flex-col justify-around">
      <div class="w- bg-white p-5">
        <div class="text-lg text-gray-600 font-bold">Really?</div>
        <div class="text-white text-center">
          <div
            class="cursor-pointer py-3 my-5 bg-red-500 rounded-lg"
            on:click={() => clickYes()}>
            yes
          </div>
          <div
            class="cursor-pointer py-3 bg-gray-500 rounded-lg"
            on:click={() => clickNo()}>
            no
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<script>
  export let value = false
  import { createEventDispatcher } from 'svelte'

  const dispatch = new createEventDispatcher()

  function clickYes() {
    dispatch('confirm')
  }

  function clickNo() {
    dispatch('cancel')
  }
</script>
