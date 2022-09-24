<div
  on:click={() => (show = true)}
  class="{$$props.class} cursor-pointer bg-white focus:ring-indigo-500 text-gray-700 p-2 focus:border-indigo-500 shadow-sm sm:text-sm border-gray-300 rounded-md">
  <div class="whitespace-no-wrap pl-1 text-sm">
    {value}
    <i class="text-gray-500 float-right mt-1 mr-2 fas fa-sort-down" />
  </div>
  {#if show === true}
    <div
      on:click|stopPropagation={() => (show = false)}
      class="fixed z-10 cursor-default top-0 left-0 right-0 bottom-0 opacity-50 bg-black" />

    <div
      class="absolute z-30 justify-end shadow-md mt-3 items bg-gray-300 left-0 right-0 flex flex-row w-full">
      <div class="-mt-2 right-0 absolute mr-4 arrow-up" />
      {#each types as type}
        <div
          class="text-center cursor-pointer px-5 py-3 bg-white border-l border-r"
          on:click|stopPropagation={() => clickType(type)}>
          <i
            style="font-size: {type.size || 'default'}"
            class="text-gray-600 mb-2 block {type.icon}" />
          {type.value}
        </div>
      {/each}
    </div>
  {/if}
</div>

<script>
  import { createEventDispatcher } from 'svelte'

  let show = false
  export let value = 'g'
  const dispatch = new createEventDispatcher()

  const types = [
    { icon: 'fas fa-ellipsis-v\n', value: '少々' },
    { icon: 'fas fa-weight-hanging', value: 'g' },
    { icon: 'fas fa-tint', value: '㏄' },
    { icon: 'fas fa-utensil-spoon', value: '大さじ' },
    { icon: 'fas fa-utensil-spoon', size: '0.8rem', value: '小さじ' },
    { icon: 'fas fa-circle', value: '個' },
  ]

  function onInput() {
    dispatch('input')
  }

  function clickType(type) {
    show = false
    value = type.value
    onInput()
  }

  export function focus() {
    show = true
  }

</script>

<style>
  .arrow-up {
    width: 0;
    height: 0;

    border-left: 12px solid transparent;
    border-right: 12px solid transparent;

    border-bottom: 12px solid white;
  }

</style>
