<div class="App h-screen flex flex-col">
  <Header>sd</Header>
  <div class="bg-gray-200 flex-grow">
    <Storage />
  </div>
</div>

<script>
  import '~css/main.css'

  import Header from '~components/Header.svelte'
  import Storage from './components/Storage.svelte'

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
