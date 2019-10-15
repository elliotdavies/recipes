<script>
  import { submitRecipe } from "./api";
  import { recipes } from "./store";

  let state = {
    url: "",
    notes: "",
    request: {
      status: "notAsked"
    }
  };

  const onSubmit = e => {
    e.preventDefault();

    const url = state.url;
    if (!url.length) return;
    state.url = "";
    
    submitRecipe(url, state.notes)
      .then(res => res.json())
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
</script>

<style>
h2 {
  font-weight: normal;
  font-size: 20px;
}

label {
  width: 100%;
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

span {
  display: block;
  margin-right: 5px;
}

input, textarea {
  width: 100%;
  margin: 0;
}

button {
  width: 100%;
}

div.request-status {
  text-align: center;
}
</style>

<section>
  <h2>Save new recipe</h2>
  <form on:submit={onSubmit}>
    <label>
      <span>URL:</span>
      <input type="url" bind:value={state.url} />
    </label>

    <label>
      <span>Notes:</span>
      <textarea bind:value={state.notes}></textarea>
    </label>

    <button type="submit">
      Submit
    </button>

    <div class="request-status">
    {#if state.request.status === 'success'}
    Submitted ✅
    {:else if state.request.status === 'failure'}
    ❗Failed :
    <code>{state.request.error}</code>
    {/if}
    </div>
  </form>
</section>
