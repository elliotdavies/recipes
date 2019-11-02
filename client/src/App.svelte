<script>
  import { Router, Route } from 'svelte-routing';

  import Header from "./Header.svelte";
  import Home from "./Home.svelte";
  import Recipe from "./Recipe.svelte";
  import Submit from "./Submit.svelte";

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
      <Home />
    </Route>

    <Route path="/submit">
      <Submit />
    </Route>

    <Route path="/recipe/:id" let:params>
      <Recipe id={params.id} />
    </Route>
  </main>
</Router>
