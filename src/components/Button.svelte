<button
  type="button"
  class="{$$props.class} inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-{color}-{tone + 100} hover:bg-{color}-{tone + 200} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-{color}-{tone}"
  on:click={onClick}>
  <slot>{text}</slot>
</button>

<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  export let text = ''
  export let color = 'blue'
  export let tone = 500

  function onClick() {
    dispatch('click')
  }
</script>
