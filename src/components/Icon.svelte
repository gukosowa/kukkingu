<i class={classes} style={cstyles} />

<script>
  export let icon = ''
  export let size = '3rem'

  $: cstyles = cssVarStyles + '; ' + ($$props.style || '')
  let classes = 'relative ' + ($$props.class || '') + ' ' + icon

  let styles = {
    'font-size': size,
  }
  $: cssVarStyles = Object.entries(styles)
    .map(([key, value]) => `${key}:${value}`)
    .join(';')
</script>
