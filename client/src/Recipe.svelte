<script>
  import { navigate } from "svelte-routing";

  import { toFullUrl } from './utils';
  import { recipes, sessionId } from "./store";
  import { updateRecipe, deleteRecipe } from "./api"

  import Form from './Recipe/Form.svelte'

  export let id;

  let state = {
    sessionId: null,
    recipe: null,
    editing: false,
    request: {
      status: "notAsked"
    }
  };

  sessionId.subscribe(id => {
    state.sessionId = id;
  })

  recipes.subscribe(rs => {
    const match = rs.find(r => r.id == id);
    if (match) state.recipe = match;
  });

  const onEdit = () => {
    state.editing = true;
  }

  const onSave = recipe => {
    const { url, title, notes, images } = recipe;

    updateRecipe(state.sessionId, state.recipe.id, url, title, notes, images)
      .then(() => {
        recipes.update(rs =>
          rs.map(r => r.id === id ? { ...r, recipe } : r));
        state.request = {
          status: "success"
        }
      })
      .catch(error => {
        state.request = {
          status: "failure",
          error
        }
      })
      .then(() => {
        state.editing = false;
      })
  }

  const reset = () => {
    state.editing = false;
    state.request = {
      status: 'notAsked'
    }
  }

  const onDelete = e => {
    e.preventDefault();

    const { id } = state.recipe;

    deleteRecipe(state.sessionId, id)
      .then(() => {
        recipes.update(rs => rs.filter(r => r.id !== id));
        state.request = {
          status: "success"
        };
        navigate("/");
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
section {
  margin-bottom: 20px;
}

.title h1 {
  margin: 0 0 10px 0;
}

.title small {
  display: block;
  font-size: 13px;
  font-weight: bold;
  word-wrap: break-word;
}

.notes h2,
.images h2 {
  margin: 0 0 10px 0;
}

.images-preview {
  display: flex;
  flex-direction: row;
  overflow-x: auto;
  list-style-type: none;
  margin: 0;
  padding: 0;
}

.image {
  flex-shrink: 0;
  background-color: lightgrey;
  height: 200px;
  margin-right: 20px;
}
.image img {
  max-height: 100%;
  max-width: 100%;
}

.notes .notes-preview {
  white-space: pre-wrap;
  margin-bottom: 10px;
}

.actions button {
  margin: 0 0 10px 0;
  width: 100%;
}
</style>

{#if state.recipe !== null}
<div class="recipe">

  {#if !state.editing && state.request.status == 'notAsked'}
    <section class="title">
      <h1>{state.recipe.title}</h1>
      <small>{state.recipe.url}</small>

      {#if state.recipe.url}
        <a href={toFullUrl(state.recipe.url)} target="_blank" rel="noopener">
          <p>Go to recipe</p>
        </a>
      {/if}
    </section>

    {#if state.recipe.images.length > 0}
    <section class="images">
      <h2>Images</h2>
      <ul class="images-preview">
        {#each state.recipe.images as filename}
          <li class="image">
            <a href={`//recipes.elliotdavies.co.uk/images/${filename}`}>
              <img src={`//recipes.elliotdavies.co.uk/images/${filename}`} alt="" />
            </a>
          </li>
        {/each}
      </ul>
    </section>
    {/if}

    {#if state.recipe.notes.length > 0}
    <section class="notes">
      <h2>Notes</h2>
      <div class="notes-preview">{state.recipe.notes}</div>
    </section>
    {/if}

    <section class="actions">
      <button type="button" on:click={onEdit}>Edit</button>
      <button type="button" on:click={onDelete}>Delete</button>
    </section>

  {:else if state.editing && state.request.status === 'notAsked'}

    <Form recipe={state.recipe} onSave={onSave} onCancel={reset} />

  {:else if state.request.status === 'success'}

    <div class="success">
      <span class="status">Updated successfully</span>
      <button type="button" on:click={reset}>Go back</button>
    </div>

  {:else if state.request.status === 'failure'}

    <div class="failure">
      <span class="status success">Failed to update :-(</span>
      <code>{state.error}</code>
      <button type="button" on:click={reset}>Go back</button>
    </div>

  {/if}
</div>
{/if}
