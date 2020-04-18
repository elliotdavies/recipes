<script>
  import { Router, Route } from 'svelte-routing';

  import { getRecipes, getImage, postImage } from "./api";
  import { recipes } from "./store";

  import Header from "./Header.svelte";
  import Home from "./Home.svelte";
  import Recipe from "./Recipe.svelte";
  import Submit from "./Submit.svelte";

  let url = "";

/*   getRecipes() */
/*     .then(rs => { */
/*       recipes.set(rs); */
/*     }); */

  /* getImage("abc.png").then(res => console.log(res)); */

  const onSubmit = e => {
    e.preventDefault();
    console.log({a:e.target});
    const files = e.target.elements[0].files;
    const formData = new FormData();
    formData.append('image', files[0]);
    postImage(formData);
  }
</script>

<style>
</style>

<svelte:head>
  <link href="https://fonts.googleapis.com/css?family=Shadows+Into+Light&display=swap" rel="stylesheet">
</svelte:head>

<Router url="{url}">
  <Header />

  <form on:submit={onSubmit}>
    <input name="file" type="file" accept="image/*" />
    <button type="submit">Do it</button>
  </form>

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
