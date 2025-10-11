<script lang="ts">
  import Router, { replace } from 'svelte-spa-router';

  import { getRecipes } from "./api";
  import { getSessionId } from "./utils";
  import { recipes, sessionId } from "./store";

  import Header from "./Header.svelte";
  import Home from "./Home.svelte";
  import Recipe from "./Recipe.svelte";
  import Submit from "./Submit.svelte";
  import Auth from "./Auth.svelte";

  const session_id = getSessionId()
  sessionId.set(session_id);

  if (session_id) {
    getRecipes(session_id)
      .then(rs => {
        recipes.set(rs);
      });
  }

  const routes = {
    '/': Home,
    '/auth': Auth,
    '/submit': Submit,
    '/recipe/:id': Recipe,
  }
</script>

<style>
</style>

<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Shadows+Into+Light&display=swap" rel="stylesheet">
</svelte:head>

<Header />

<main>
  <Router {routes} />
</main>
