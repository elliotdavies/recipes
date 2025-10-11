<script lang="ts">
  import { Link } from 'svelte-navigator';
</script>

<style>
header {
  margin-bottom: 20px;
  border-bottom: 1px solid lightgrey;
  padding: 10px;
}

h1 {
  text-align: center;
  margin: 0;
  font-size: 30px;
  font-family: 'Shadows Into Light', cursive;
  font-weight: normal;
}

a {
  text-decoration: none;
  color: inherit;
}
</style>

<header>
  <h1>
    <Link to="/">Recipes 📚</Link>
  </h1>
</header>
