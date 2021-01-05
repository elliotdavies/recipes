<script>
  import { navigate } from 'svelte-routing'
  import { sessionId } from './store'
  import { loginWithGoogle, logout } from './api';
  import { setSessionId, unsetSessionId } from './utils'

  let state = {
    sessionId: null
  }

  sessionId.subscribe(id => {
    state.sessionId = id;
  })

  window.onSignIn = googleUser => {
    if (state.sessionId !== null) {
      return
    }

    const id_token = googleUser.getAuthResponse().id_token;
    loginWithGoogle(id_token)
      .then(({ session_id }) => {
        sessionId.set(session_id);
        setSessionId(session_id);
        navigate("/");
      })
      .catch(e => {
        console.error(e);
      })
  }

  const signOut = () => {
    const go = () =>
      logout(state.sessionId)
        .then(() => {
          sessionId.set(null);
          unsetSessionId();
        })

    if (gapi.auth2) {
      gapi.auth2.getAuthInstance().signOut().then(go)
    } else {
      go()
    }
  }
</script>

<style>
</style>

{#if !state.sessionId}
<div class="g-signin2" data-onsuccess="onSignIn"></div>
{:else}
<button on:click={signOut}>Sign out</button>
{/if}
