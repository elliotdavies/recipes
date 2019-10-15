<script>
  import { Router, Route } from 'svelte-routing';

  import Header from "./Header.svelte";
  import SubmitRecipe from "./SubmitRecipe.svelte";
  import RecipePage from "./RecipePage.svelte";
  import RecipeList from "./RecipeList.svelte";

  let url = "";
</script>

<style>
</style>

<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Shadows+Into+Light&display=swap" rel="stylesheet">
</svelte:head>

<Router url="{url}">
  <Header />
  <main>
    <Route path="/">
      <SubmitRecipe />
    </Route>

    <Route path="/recipe/:id" let:params>
      <RecipePage id={params.id} />
    </Route>

    <RecipeList />
  </main>
</Router>
