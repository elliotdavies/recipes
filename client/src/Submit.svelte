<script>
  import { link } from 'svelte-routing';

  import { submitRecipe } from "./api";
  import { recipes } from "./store";

  let state = {
    form: {
      url: "",
      title: "",
      notes: "",
    },
    request: {
      status: "notAsked",
    }
  };

  const onSubmit = e => {
    e.preventDefault();

    let { form: { url, title, notes } } = state;

    if (!url.length || !title.length) return;
    
    submitRecipe(url, title, notes)
      .then(recipe => {
        state.request = {
          status: "success"
        };
        recipes.update(rs => [...rs, recipe])
      })
      .catch(error => {
        state.request = {
          status: "failure",
          error
        };
      });
  };

  const reset = () => {
    state.form = {
      url: "",
      title: "",
      notes: ""
    };
    state.request = {
      status: "notAsked"
    }
  };

  const retry = () => {
    state.request = {
      status: "notAsked"
    }
  };
</script>

<style>
h2 {
  font-weight: normal;
  font-size: 20px;
}

label {
  width: 100%;
  display: block;
  margin-bottom: 10px;
}

label span {
  display: block;
  margin-right: 5px;
  margin-bottom: 5px;
}

input, textarea {
  width: 100%;
  margin: 0;
}

button {
  width: 100%;
}

.request-status {
  text-align: center;
}

.request-status a,
.request-status button,
.request-status span,
.request-status code {
  display: block;
  margin-bottom: 15px;
}
</style>

<section>
  <h2>Save new recipe</h2>

  <form on:submit={onSubmit}>
    <label>
      <span>URL</span>
      <input type="url" bind:value={state.form.url} />
    </label>

    <label>
      <span>Title</span>
      <input type="text" bind:value={state.form.title} />
    </label>

    <label>
      <span>Notes</span>
      <textarea bind:value={state.form.notes}></textarea>
    </label>

    <div class="request-status">
    {#if state.request.status === 'success'}

      <div class="success">
        <span class="status">Saved successfully!</span>
        <button type="button" on:click={reset}>Save another</button>
        <a href="/" use:link>Go home</a>
      </div>

    {:else if state.request.status === 'failure'}

      <div class="failure">
        <span class="status success">Failed to save :-(</span>
        <code>{state.request.error}</code>
        <button type="button" on:click={retry}>Try again</button>
      </div>

    {:else if state.request.status === 'notAsked'}

      <div class="notAsked">
        <button type="submit">Submit</button>
      </div>

    {/if}
    </div>
  </form>
</section>
