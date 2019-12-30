<script>
  export let recipe = {
    url: "",
    title: "",
    notes: "",
  }

  export let onSave;
  export let onCancel;

  const onSubmit = e => {
    e.preventDefault();

    const { url, title } = recipe;
    if (!url.length || !title.length) return;

    onSave(recipe);
  }
</script>

<style>
button, input, label, textarea {
  width: 100%;
  margin: 0;
}

label {
  display: block;
  margin-bottom: 10px;
}

label span {
  display: block;
  margin-right: 5px;
  margin-bottom: 5px;
}

button {
  margin-bottom: 10px;
}
</style>

<form on:submit={onSubmit}>
  <label>
    <span>URL</span>
    <input type="url" bind:value={recipe.url} />
  </label>

  <label>
    <span>Title</span>
    <input type="text" bind:value={recipe.title} />
  </label>

  <label>
    <span>Notes</span>
    <textarea bind:value={recipe.notes}></textarea>
  </label>

  <button>Save</button>
  <button type="button" on:click={onCancel}>Cancel</button>
</form>
