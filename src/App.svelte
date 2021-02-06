<div class="App h-screen flex flex-col">
  <Header />
  <div class="mt-16 bg-gray-200 flex-grow p-2">
    {#if $openedRecipe === -1}
      <Storage />
    {:else}
      <Recipe />
    {/if}
  </div>
</div>

<script>
  // https://golb.hplar.ch/2019/07/ocr-with-tesseractjs.html
  import 'https://unpkg.com/tesseract.js@2.1.3/dist/tesseract.min.js'

  import { openedRecipe } from '~src/store'
  import '~css/main.css'

  import Header from '~components/Header.svelte'
  import Storage from './components/Storage.svelte'

  import Recipe from './components/Recipe.svelte'
</script>

<style>
</style>
