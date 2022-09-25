<ModalConfirm
  bind:value={showDeleteConfirm}
  bind:removeName={deleteConfirmName}
  on:confirm={() => clearAll()}
  on:cancel={() => cancelClearAll()} />

<footer
  class="z-10 flex-grow px-2 mt-8 text-gray-500 text-sm flex w-full items-end ">
  <div class="h-8 flex items-center w-full">
    <div class="w-full text-xs flex items-baseline">
      <div class="flex-grow flex">
        <div class="flex-grow self-center">
          <a class="" href="/privacy-statement.txt">Privacy Policy</a>
          <div class="mt-1 mb-2" on:click={initClearAll}>clear all</div>
        </div>

        <div class="flex-shrink">
          {#await userPromise}
            <Icon icon="fal fa-sync fa-spin mr-4" size="1.2rem" />
          {:then user}
            {#if !!user}<span>シンクのユーザー名: {user.email}</span>{/if}
          {/await}
        </div>
      </div>
    </div>
  </div>
</footer>

<script>
  import ModalConfirm from '~components/ModalConfirm.svelte'
  import { userPromise } from '~src'
  import { recipes } from '~src/store/index.js'
  import Icon from './Icon.svelte'

  let showDeleteConfirm = false
  let deleteConfirmName = 'すべてのレシピ'

  function initClearAll() {
    showDeleteConfirm = true
  }

  function clearAll() {
    recipes.set([])
  }

  function cancelClearAll() {
    showDeleteConfirm = false
  }

</script>
