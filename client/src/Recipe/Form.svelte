<script>
  import { postImage } from '../api'

  export let recipe = {
    url: "",
    title: "",
    notes: "",
    images: [],
  }

  export let onSave;
  export let onCancel;

  let state = {
    recipe,
    selectedImage: null,
    imageRequest: {
      status: "notAsked"
    }
  }

  const imageInputOnChange = e => {
    e.preventDefault();

    if (e.target.files && e.target.files.length > 0) {
      state.selectedImage = e.target.files[0]
    }
  }

  const onUploadImage = e => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('image', state.selectedImage);

    postImage(formData)
      .then(filename => {
        state.recipe.images.push(filename);
        state.imageRequest = {
          status: 'success'
        }
        state.selectedImage = null
      })
      .catch(error => {
        state.imageRequest = {
          status: 'failure',
          error
        }
      })
  }

  const onSubmit = e => {
    e.preventDefault();

    const { title } = state.recipe;
    if (!title.length) return;

    const { selectedImage } = state;
    if (selectedImage !== null) {
      console.log('Image selected but not uploaded');
      console.log(selectedImage);
      return;
    }

    onSave(state.recipe);
  }
</script>

<style>
button, input, label, textarea, fieldset {
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
button:disabled {
  color: grey;
}

fieldset {
  padding: 0;
  border: 0;
}

.images {
  margin: 0;
}
.images small {
  display: block;
  margin-bottom: 5px;
}
</style>

<form on:submit={onSubmit}>
  <label>
    <span>URL</span>
    <input type="url" bind:value={state.recipe.url} />
  </label>

  <label>
    <span>Title</span>
    <input type="text" required bind:value={state.recipe.title} />
  </label>

  <fieldset>
    <span>Images</span>

    <ul class="images">
    {#each state.recipe.images as filename}
      <li class="image">
        <span>{filename}</span>
      </li>
    {:else}
      <small>No images yet...</small>
    {/each}
    </ul>

    <label>
      <span>Choose file</span>
      <input
        name="file"
        type="file"
        accept="image/*"
        enctype="multipart/form-data"
        bind:value={state.selectedImage}
        on:change={imageInputOnChange}
      />
    </label>

    <button
      type="button"
      disabled={!state.selectedImage}
      on:click={onUploadImage}
    >
      Upload image
    </button>
  </fieldset>

  <label>
    <span>Notes</span>
    <textarea bind:value={state.recipe.notes}></textarea>
  </label>

  <button>Save</button>
  <button type="button" on:click={onCancel}>Cancel</button>
</form>
