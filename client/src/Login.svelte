<script>
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

    const profile = googleUser.getBasicProfile();
    const email = profile.getEmail();
    const name = profile.getName();

    loginWithGoogle(email, name)
      .then(session_id => {
        sessionId.set(session_id);
        setSessionId(session_id)
      })
      .catch(e => {
        console.error(e);
      })
  }

  const signOut = () => {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      logout(state.sessionId);
      sessionId.set(null);
      unsetSessionId();
    });
  }
</script>

<style>
</style>

{#if !state.sessionId}
<div class="g-signin2" data-onsuccess="onSignIn"></div>
{:else}
<button on:click={signOut}>Sign out</button>
{/if}
