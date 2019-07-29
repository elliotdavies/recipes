<script>
  export let onSubmitRecipe;

  import { submitRecipe } from "./api";

  let state = {
    text: "",
    request: {
      status: "notAsked"
    }
  };

  const onSubmit = () => {
    const text = state.text;
    if (!text.length) return;
    state.text = "";
    
    submitRecipe(text)
    .then(res => {
      state.request = {
        status: "success"
      };
      return onSubmitRecipe(res);
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

input {
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
  <form on:submit|preventDefault>
    <label>
      <span>URL:</span>
      <input type="text" bind:value={state.text} />
    </label>

    <button type="button" on:click={onSubmit}>
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
