<script>
  import { link } from 'svelte-routing';

  import { getRecipes } from "../api";
  import { recipes } from "../store";
  import { toFullUrl } from '../utils';

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
h2 {
  font-weight: normal;
  font-size: 20px;
}

.recipes {
  margin: 0;
  padding: 0;
}

.recipe {
  border: 1px dotted navy;
  border-radius: 4px;
  padding: 5px;
  margin-bottom: 10px;
}

.recipe p {
  margin-top: 0;
  word-wrap: break-word;
}

.recipe ul {
  margin: 0;
  padding: 0;
  list-style-position: inside;
}

.recipe li a {
  display: inline-block;
  padding: 10px 0;
}
</style>

<section>
  <h2>Recently added recipes</h2>

  <ul class="recipes">
  {#each sortRecipes(state.recipes) as recipe}
    <li class="recipe">
      <p class="url">URL: {recipe.url}</p>

      <ul>
        <li>
          <a href={toFullUrl(recipe.url)} target="_blank" rel="noopener">
            Go to recipe URL
          </a>
        </li>

        <li>
          <a href={`/recipe/${recipe.id}`} use:link>
            View full recipe
          </a>
        </li>
      </ul>
    </li>
  {:else}
    <span>No recipes yet...</span>
  {/each}
  </ul>
</section>
