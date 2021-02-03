<div class={$$props.class}>
  {#if value}
    <div
      on:click={() => click()}
      class="w-10 h-10 bg-blue-600 border-2 border-blue-400 block text-center rounded-lg">
      <i class="fas fa-check text-md" />
    </div>
  {:else}
    <div
      on:click={() => click()}
      class="w-10 h-10 bg-white border-2 border-blue-400 block rounded-lg" />
  {/if}
</div>

<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  export let value = false

  function click() {
    value = !value
    dispatch('input', value)
  }
</script>

<style>
  div {
    cursor: pointer;
  }
</style>
