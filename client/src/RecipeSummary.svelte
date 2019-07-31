<script>
  export let recipe;

  const toFullUrl = url =>
    url.startsWith('http') ? url : 'http://' + url;
</script>

<style>
.recipe {
  border: 1px dotted navy;
  border-radius: 4px;
  padding: 5px;
  margin-bottom: 10px;
}

p {
  margin: 0;
}
</style>

<div class="recipe">
  <a href={toFullUrl(recipe.url)} target="_blank">
    <p>ID: {recipe.id}</p>
    <p>URL: {recipe.url}</p>
  </a>
</div>
