<script>
  import { Router, Route, navigate } from 'svelte-routing';

  import { getRecipes } from "./api";
  import { getSessionId } from "./utils";
  import { recipes, sessionId } from "./store";

  import Header from "./Header.svelte";
  import Home from "./Home.svelte";
  import Recipe from "./Recipe.svelte";
  import Submit from "./Submit.svelte";
  import Login from "./Login.svelte";

  let url = "";

  const session_id = getSessionId()
  sessionId.set(session_id);

  if (session_id) {
    getRecipes(session_id)
      .then(rs => {
        recipes.set(rs);
      });
  } else {
    navigate("/login")
  }
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

    <Route path="/login">
      <Login />
    </Route>

    <Route path="/submit">
      <Submit />
    </Route>

    <Route path="/recipe/:id" let:params>
      <Recipe id={params.id} />
    </Route>
  </main>
</Router>
