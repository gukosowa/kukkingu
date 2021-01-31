<div class="flex items-baseline {$$props.class}">
  {#if icon}
    <Icon {icon} class="mr-1" style="top: 3px;" size="1.6rem" />
  {/if}
  <label style="width: 100%;">
    <input
      {type}
      {placeholder}
      {value}
      on:input={handleInput}
      on:keypress={onKeyPress}
      disabled={!!disabled}
      use:init
      class="w-full {inputClass} focus:ring-indigo-500 text-black p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md" />
  </label>
</div>

<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  import Icon from './Icon.svelte'
  export let type = 'text'
  export let inputClass = ''
  export let value = ''
  export let icon = ''
  export let disabled = false
  export let placeholder = ''
  export let autofocus = false

  const handleInput = (e) => {
    value = type.match(/^(number|range)$/) ? +e.target.value : e.target.value
    dispatch('input', value)
  }

  const onKeyPress = (e) => {
    if (e.keyCode === 13) dispatch('enter', value)
  }

  function init(el) {
    if (autofocus) {
      el.focus()
    }
  }
</script>
