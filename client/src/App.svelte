<script lang="ts">
  import { Router, Route } from "svelte-navigator";

  import { getRecipes } from "./api";
  import { getSessionId } from "./utils";
  import { recipes, sessionId } from "./store";

  import Header from "./Header.svelte";
  import Home from "./Home.svelte";
  import Recipe from "./Recipe.svelte";
  import Submit from "./Submit.svelte";
  import Auth from "./Auth.svelte";

  const session_id = getSessionId();
  sessionId.set(session_id);

  if (session_id) {
    getRecipes(session_id).then((rs) => {
      recipes.set(rs);
    });
  }
</script>

<svelte:head>
  <link
    href="https://fonts.googleapis.com/css?family=Shadows+Into+Light&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<Router>
  <Header />
  <main>
    <Route path="/" component={Home} primary={false} />
    <Route path="/auth" component={Auth} primary={false} />
    <Route path="/submit" component={Submit} primary={false} />
    <Route path="/recipe/:id" let:params primary={false}>
      <Recipe id={params.id} />
    </Route>
  </main>
</Router>

<style>
</style>
