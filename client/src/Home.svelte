<script lang="ts">
  import { Link, navigate } from 'svelte-navigator';
  import { onMount } from 'svelte';
  import { sessionId } from "./store";

  import List from "./Home/List.svelte"

  let session_id: string | null = null;
  sessionId.subscribe(id => {
    session_id = id;
  });

  onMount(() => {
    if (!session_id) {
      navigate('/auth');
    }
  });
</script>

<style>
</style>

<Link to="/submit">Save new recipe</Link>
<List />
