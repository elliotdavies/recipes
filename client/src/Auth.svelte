<script>
  import { navigate } from 'svelte-routing'
  import * as store from './store'
  import * as api from './api';
  import { setSessionId, unsetSessionId } from './utils'

  let state = {
    sessionId: null,
    signUp: {
      name: null,
      email: null,
      password: null,
    },
    signIn: {
      email: null,
      password: null,
    }
  }

  store.sessionId.subscribe(id => {
    state.sessionId = id;
  })

  const getRecipes = (sessionId) =>
    api.getRecipes(sessionId)
      .then(rs => store.recipes.set(rs))

  const signUp = (e) => {
    e.preventDefault();

    const { name, email, password } = state.signUp;
    if (!name || !email || !password) {
      return;
    }

    api.signUp(name, email, password)
      .then(({sessionId}) => {
        store.sessionId.set(sessionId);
        setSessionId(sessionId);
        return sessionId
      })
      .then(getRecipes)
      .then(() => {
        navigate("/");
      })
      .catch(e => {
        console.error(e);
      })
  }

  const signIn = (e) => {
    e.preventDefault();

    const { email, password } = state.signIn;
    if (!email || !password) {
      return;
    }

    api.signIn(email, password)
      .then(({sessionId}) => {
        store.sessionId.set(sessionId);
        setSessionId(sessionId);
        return sessionId
      })
      .then(getRecipes)
      .then(() => {
        navigate("/");
      })
      .catch(e => {
        console.error(e);
      })
  }

  const signOut = () => {
    api.signOut(state.sessionId)
      .then(() => {
        store.sessionId.set(null);
        unsetSessionId();
      })
      .catch(e => {
        console.error(e);
      })
  }
</script>

<style>
</style>

{#if !state.sessionId}

<h2>Sign in</h2>

<form on:submit={signIn}>
  <label>
    <span>Email</span>
    <input type="email" required bind:value={state.signIn.email} />
  </label>

  <label>
    <span>Password</span>
    <input type="password" required bind:value={state.signIn.password} />
  </label>

  <button type="submit">Sign in</button>
</form>

<hr />

<h2>Create an account</h2>

<form on:submit={signUp}>
  <label>
    <span>Name</span>
    <input type="text" required bind:value={state.signUp.name} />
  </label>

  <label>
    <span>Email</span>
    <input type="email" required bind:value={state.signUp.email} />
  </label>

  <label>
    <span>Password</span>
    <input type="password" required bind:value={state.signUp.password} />
  </label>

  <button type="submit">Sign up</button>
</form>

{:else}

<button on:click={signOut}>Sign out</button>

{/if}
