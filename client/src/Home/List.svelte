<script>
  import { link } from 'svelte-routing';

  import { recipes } from "../store";

  let state = {
    recipes: [],
    searchText: ""
  };

  recipes.subscribe(rs => {
    state.recipes = rs.sort((a,b) => b.id - a.id);
  });

  const normalise = s => s.trim().toLowerCase();

  $: normalisedSearchText = normalise(state.searchText);
  $: filteredRecipes = state.recipes.filter(
    ({ url, title, notes }) => 
      [url,title,notes].some(x => normalise(x).includes(normalisedSearchText))
  );
</script>

<style>
h2 {
  font-weight: normal;
  font-size: 20px;
}

.search span {
  margin-right: 5px;
}

.recipes {
  margin: 0;
  padding: 0;
}

.recipe {
  border: 1px dotted navy;
  border-radius: 4px;
  margin-bottom: 10px;
}

.recipe a {
  display: block;
  padding: 5px;
}

.recipe p {
  margin-top: 0;
  word-wrap: break-word;
}
</style>

<section>
  <h2>Your recipes</h2>

  <label class="search">
    <span>Search recipes:</span>
    <input type="text" bind:value={state.searchText} />
  </label>

  <ul class="recipes">
  {#each filteredRecipes as recipe}
    <li class="recipe">
      <a href={`/recipe/${recipe.id}`} use:link>
        <p class="title">{recipe.title || recipe.url}</p>
      </a>
    </li>
  {:else}
    <span>No recipes yet...</span>
  {/each}
  </ul>
</section>
