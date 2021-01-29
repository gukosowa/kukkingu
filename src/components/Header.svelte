<header
  class="px-2 text-white h-16 bg-blue-600 flex items-center shadow-md border-b border-blue-700">
  <div>calc</div>

  <div class="flex-1 text-right">
    <SInput placeholder="original" bind:value={valueOriginal} />
    <SInput
      icon="fal fa-play-circle"
      placeholder="want"
      bind:value={valueDesired} />
  </div>
</header>

<script>
  import SInput from '~components/Input.svelte'

  $: console.log(valueOriginal) || console.log('original')
  $: console.log(valueDesired) || console.log('desired')

  let valueOriginal
  let valueDesired
</script>
