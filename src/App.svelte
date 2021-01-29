<div class="App">
  <header
    class="px-4 text-white h-16 bg-blue-600 flex items-center shadow-md border lg:focus:border-blue-500">
    <div>calc</div>
  </header>
</div>

<script>
  import '~css/main.css'
  import { onMount } from 'svelte'
  let count = 0
  onMount(() => {
    const interval = setInterval(() => count++, 1000)
    return () => {
      clearInterval(interval)
    }
  })
</script>

<style>
</style>
