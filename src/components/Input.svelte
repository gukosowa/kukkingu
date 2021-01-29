<label>
  {#if icon}
    <Icon {icon} style="top: 3px;" size="1.6rem" />
  {/if}
  <input
    type="text"
    {placeholder}
    bind:value
    class="mt-1 focus:ring-indigo-500 text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md" />
</label>

<script>
  import Icon from './Icon.svelte'
  export let value = ''
  export let icon = ''
  export let placeholder = ''
</script>
