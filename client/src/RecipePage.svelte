<script>
  import { toFullUrl } from './utils';
  import { recipes } from "./store";

  export let id;

  let state = {
    recipe: null
  };

  recipes.subscribe(rs => {
    const match = rs.find(r => r.id == id);
    if (match) state.recipe = match;
  });
</script>

<style>
.recipe {
  margin-bottom: 20px;
}

h1 > span {
  display: block;
}
h1 > small {
  display: block;
  font-size: 13px;
}

.notes {
  white-space: pre-wrap;
}
</style>

{#if state.recipe !== null}
<div class="recipe">
  <h1>
    <span>Recipe</span>
    <small>{state.recipe.url}</small>
  </h1>

  <a href={toFullUrl(state.recipe.url)} target="_blank" rel="noopener">
    <p>Go to recipe</p>
  </a>

  <section>
    <h2>Notes</h2>
    <div class="notes">{state.recipe.notes}</div>
  </section>
</div>
{/if}
