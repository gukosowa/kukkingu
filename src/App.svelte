<div class="App h-screen flex flex-col">
  <Header />
  <div class="mt-16 bg-gray-200 flex-grow p-2">
    <Router {routes} restoreScrollState={true} on:routeLoaded={routeLoaded} />
  </div>
</div>

<script>
  import Header from '~components/Header.svelte'
  import Router from 'svelte-spa-router'
  import '~css/main.css'
  import { fetchBackend } from '~plugins/helper.js'

  import Storage from '~src/components/Storage.svelte'
  import Recipe from '~src/components/Recipe.svelte'
  import { recipes, route, storeAuth } from '~src/store'

  const routes = {
    '/recipe/:id': Recipe,
    '/': Storage,
  }

  if (location.hash.startsWith('#access_token')) {
    const urlParts = Object.fromEntries(
      new Map(
        location.hash.split('&').map((p) => p.replace('#', '').split('='))
      )
    )

    storeAuth.set(urlParts)
  }

  function routeLoaded(event) {
    route.set(event.detail)
  }

</script>

<style>
</style>
