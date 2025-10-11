<script lang="ts">
  import { link } from 'svelte-spa-router';

  import List from "./Home/List.svelte"
</script>

<style>
</style>

<a href="/submit" use:link>Save new recipe</a>
<List />
