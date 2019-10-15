<script>
  import { link } from 'svelte-routing';

  import { toFullUrl } from './utils';

  export let recipe;
</script>

<style>
.recipe {
  border: 1px dotted navy;
  border-radius: 4px;
  padding: 5px;
  margin-bottom: 10px;
}

p {
  margin-top: 0;
}

ul {
  margin: 0;
  padding: 0;
  list-style-position: inside;
}

li a {
  display: inline-block;
  padding: 10px 0;
}
</style>

<div class="recipe">
  <p>URL: {recipe.url}</p>

  <ul>
    <li>
      <a href={toFullUrl(recipe.url)} target="_blank">
        Go to recipe URL
      </a>
    </li>

    <li>
      <a href={`/recipe/${recipe.id}`} use:link>
        View full recipe
      </a>
    </li>
  </ul>
</div>
