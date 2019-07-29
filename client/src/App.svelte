<script>
  import Header from "./Header.svelte";
  import SubmitRecipe from "./SubmitRecipe.svelte";
  import RecipeList from "./RecipeList.svelte";

  const onSubmitRecipe = res => Promise.resolve();
</script>

<style>
hr {
  margin: 10px 0;
}
</style>

<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Shadows+Into+Light&display=swap" rel="stylesheet">
</svelte:head>

<Header />
<main>
  <SubmitRecipe {onSubmitRecipe} />
  <hr />
  <RecipeList />
</main>
