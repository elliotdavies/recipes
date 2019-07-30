<script>
  import { getRecipes } from "./api";
  import { recipes } from "./store";
  import RecipeSummary from "./RecipeSummary.svelte";

  let state = {
    recipes: []
  };

  recipes.subscribe(rs => {
    state.recipes = rs;
  });

  getRecipes()
    .then(rs => {
      recipes.set(rs);
    });
</script>

<style>
h2 {
  font-weight: normal;
  font-size: 20px;
}

ul {
  margin: 0;
  padding: 0;
}
</style>

<section>
  <h2>Recently added recipes</h2>

  <ul>
  {#each state.recipes.sort((a,b) => b.id - a.id) as recipe}
    <li><RecipeSummary {recipe} /></li>
  {:else}
    <span>No recipes yet...</span>
  {/each}
  </ul>
</section>
