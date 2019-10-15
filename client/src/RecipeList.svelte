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

  const sortRecipes = rs =>
    rs.sort((a,b) => b.id - a.id)

  getRecipes()
    .then(rs => {
      recipes.set(rs);
    });
</script>

<style>
hr {
  margin: 10px 0;
}

h2 {
  font-weight: normal;
  font-size: 20px;
}

ul {
  margin: 0;
  padding: 0;
}
</style>

<hr />
<section>
  <h2>Recently added recipes</h2>

  <ul>
  {#each sortRecipes(state.recipes) as recipe}
    <li><RecipeSummary {recipe} /></li>
  {:else}
    <span>No recipes yet...</span>
  {/each}
  </ul>
</section>
