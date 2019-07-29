<script>
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
  margin: 0;
}
</style>

<div class="recipe">
  <p>ID: {recipe.id}</p>
  <p>Text: {recipe.text}</p>
</div>
