<script>
  import { toFullUrl } from './utils';
  import { recipes } from "./store";
  import { updateRecipeNotes } from "./api"

  export let id;

  let state = {
    recipe: null,
    editing: false,
    updatedNotes: "",
    request: {
      status: "notAsked"
    }
  };

  recipes.subscribe(rs => {
    const match = rs.find(r => r.id == id);
    if (match) state.recipe = match;
  });

  const onEdit = e => {
    e.preventDefault()
    state.updatedNotes = state.recipe.notes;
    state.editing = true;
  }

  const onCancel = e => {
    e.preventDefault()
    state.updatedNotes = "";
    state.editing = false;
  }

  const onSave = e => {
    e.preventDefault();
    state.editing = false;

    const { updatedNotes, recipe: { id }} = state;

    updateRecipeNotes(id, updatedNotes)
      .then(() => {
        recipes.update(rs =>
          rs.map(r => r.id === id ? { ...r, notes: updatedNotes } : r));
        state.request = {
          status: "success"
        }
        state.notes = "";
      })
      .catch(error => {
        state.request = {
          status: "failure",
          error
        }
      })
  }
</script>

<style>
.recipe {
  margin-bottom: 20px;
}

h1 > span {
  display: block;
}
h1 > small {
  display: block;
  font-size: 13px;
  word-wrap: break-word;
}

.notes textarea {
  width: 100%;
  margin: 0;
}

.controls {
  width: 100%;
}

.notes .notes-preview {
  white-space: pre-wrap;
  margin-bottom: 10px;
}
</style>

{#if state.recipe !== null}
<div class="recipe">
  <h1>
    <span>Recipe</span>
    <small>{state.recipe.url}</small>
  </h1>

  <a href={toFullUrl(state.recipe.url)} target="_blank" rel="noopener">
    <p>Go to recipe</p>
  </a>

  <section class="notes">
    <h2>Notes</h2>
    {#if state.editing}
      <textarea bind:value={state.updatedNotes}></textarea>
      <div class="edit controls">
        <button type="button" on:click={onSave}>Save</button>
        <button type="button" on:click={onCancel}>Cancel</button>
      </div>
    {:else}
      <div class="notes-preview">{state.recipe.notes}</div>
      <div class="preview controls">
        <button type="button" on:click={onEdit}>Edit</button>
      </div>
    {/if}

    <div class="request-status">
    {#if state.request.status === 'success'}
      Saved!
    {:else if state.request.status === 'failure'}
      Failed to save
    <code>{state.request.error}</code>
    {/if}
  </section>
</div>
{/if}
