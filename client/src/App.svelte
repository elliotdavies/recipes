<script>
  let state = {
    recipes: [],
    text: "",
  };

  const url = "http://localhost:8000";

  const get = () =>
    fetch(url)
      .then(res => res.json())
      .then(recipes => {
        state.recipes = recipes;
      });

  const post = text => fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'  
      },
      body: JSON.stringify({ text })
    })
    .then(get);
</script>

<style>
</style>

<div>
  <form on:submit|preventDefault>
    <input type="text" bind:value={state.text} />
    <button
      type="button"
      on:click={() => {
        if (state.text.length) post(state.text);
        state.text = "";
      }}
    >
      Submit
    </button>
  </form>

  <ul>
  {#each state.recipes as recipe}
    <li>{recipe.id}: {recipe.text}</li>
  {/each}
  </ul>
</div>
