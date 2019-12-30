<script>
  import { link, navigate } from 'svelte-routing';

  import { submitRecipe } from "./api";
  import { recipes } from "./store";
  import Form from './Recipe/Form.svelte'

  let state = {
    status: "notAsked",
    recipe: undefined
  };

  const onSave = recipe => {
    const { url, title, notes } = recipe;

    submitRecipe(url, title, notes)
      .then(recipe => {
        state = {
          status: "success"
        };
        recipes.update(rs => [...rs, recipe])
      })
      .catch(error => {
        state = {
          status: "failure",
          error,
          recipe
        };
      });
  };

  const onCancel = () => {
    navigate('/');
  }

  const reset = () => {
    state = {
      status: "notAsked",
      recipe: undefined
    }
  };

  const retry = () => {
    state = {
      status: "notAsked",
      recipe: state.recipe
    }
  };
</script>

<style>
h2 {
  font-weight: normal;
  font-size: 20px;
}

button {
  width: 100%;
}

a,
button,
span,
code {
  display: block;
  margin-bottom: 15px;
}
</style>

<section>
  <h2>Save new recipe</h2>

  {#if state.status === 'notAsked'}

    <Form recipe={state.recipe} onSave={onSave} onCancel={onCancel} />

  {:else if state.status === 'success'}

    <div class="success">
      <span class="status">Saved successfully!</span>
      <button type="button" on:click={reset}>Save another</button>
      <a href="/" use:link>Go home</a>
    </div>

  {:else if state.status === 'failure'}

    <div class="failure">
      <span class="status success">Failed to save :-(</span>
      <code>{state.error}</code>
      <button type="button" on:click={retry}>Try again</button>
    </div>

  {/if}
</section>
