<script>
  import { getRecipes } from "./api";
  import RecipeSummary from "./RecipeSummary.svelte";

  let state = {
    recipes: [],
  };

  getRecipes()
    .then(recipes => {
      state.recipes = recipes
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
  {#each state.recipes as recipe}
    <li><RecipeSummary {recipe} /></li>
  {:else}
    <span>No recipes yet...</span>
  {/each}
  </ul>
</section>
