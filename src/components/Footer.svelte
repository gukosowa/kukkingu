<footer
  class="z-10 px-2 mt-8 text-gray-500 text-sm h-8  flex w-full items-center">
  <div class="w-full text-xs flex items-baseline">
    <div class="flex-grow flex">
      <a class="flex-grow self-center" href="/privacy-statement.txt">Privacy
        Policy</a>
      <div class="flex-shrink">
        {#await userPromise}
          <Icon icon="fal fa-sync fa-spin mr-4" size="1.2rem" />
        {:then user}
          {#if !!user}<span>シンクのユーザー名: {user.email}</span>{/if}
        {/await}
      </div>
    </div>
  </div>
</footer>

<script>
  import { userPromise } from '~src'
  import Icon from './Icon.svelte'

</script>
