<script lang="ts">
  import { link, replace } from 'svelte-spa-router';
  import { onMount } from 'svelte';
  import { sessionId } from "./store";

  import List from "./Home/List.svelte"

  let session_id: string | null = null;
  sessionId.subscribe(id => {
    session_id = id;
  });

  onMount(() => {
    if (!session_id) {
      replace('/auth');
    }
  });
</script>

<style>
</style>

<a href="/submit" use:link>Save new recipe</a>
<List />
