<script>
  import { loginWithGoogle, logout } from './api';

  const sessionIdKey = 'recipes/session_id';

  window.onSignIn = googleUser => {
    if (localStorage.getItem(sessionIdKey) !== null) {
      return
    }

    const profile = googleUser.getBasicProfile();
    const email = profile.getEmail();
    const name = profile.getName();

    loginWithGoogle(email, name)
      .then(session_id => {
        console.log('session_id', session_id)
        localStorage.setItem(sessionIdKey, session_id)
      })
      .catch(e => {
        console.error(e);
      })
  }

  const signOut = () => {
    const auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
      localStorage.removeItem(sessionIdKey);
      logout()
    });
  }
</script>

<style>
</style>

<div class="g-signin2" data-onsuccess="onSignIn"></div>
<button on:click={signOut}>Sign out</button>
