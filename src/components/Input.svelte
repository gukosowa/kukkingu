<div class="flex items-baseline {$$props.class}">
  {#if icon}
    <Icon {icon} class="mr-1" style="top: 3px;" size="1.6rem" />
  {/if}
  <label style="width: 100%;">
    <input
      {type}
      {placeholder}
      {value}
      {id}
      bind:this={elInput}
      on:input={handleInput}
      on:keypress={onKeyPress}
      disabled={!!disabled}
      use:init
      use:selectTextOnFocus
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

  export let id = null

  export let elInput = null

  const handleInput = (e) => {
    value = type.match(/^(number|range)$/) ? +e.target.value : e.target.value
    dispatch('input', value)
  }

  const onKeyPress = (e) => {
    if (e.keyCode === 13) dispatch('enter', { value, el: elInput })
  }

  function init(el) {
    if (autofocus) {
      el.focus()
    }
  }

  function selectTextOnFocus(node) {
    const handleFocus = () => {
      node && typeof node.select === 'function' && node.select()
    }

    node.addEventListener('focus', handleFocus)

    return {
      destroy() {
        node.removeEventListener('focus', handleFocus)
      },
    }
  }
</script>
