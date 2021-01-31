{#each value as item, i}
  <div class={$$props.class}>
    <slot {item} index={i} />
  </div>
{/each}

<script>
  export let value = []
</script>
