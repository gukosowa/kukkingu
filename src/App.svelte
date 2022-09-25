<div class="App h-screen flex flex-col">
  <Header />
  <div class="mt-16 bg-gray-200 flex-grow flex flex-col p-2">
    <Router {routes} restoreScrollState={true} on:routeLoaded={routeLoaded} />
  </div>
</div>

<script>
  import Header from '~components/Header.svelte'
  import Router from 'svelte-spa-router'
  import '~css/main.css'

  import Storage from '~src/components/Storage.svelte'
  import Recipe from '~src/components/Recipe.svelte'
  import { route } from '~src/store'

  const routes = {
    '/recipe/:id': Recipe,
    '/': Storage,
  }

  function routeLoaded(event) {
    route.set(event.detail)
  }

</script>

<style>
</style>
