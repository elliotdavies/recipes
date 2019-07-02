<script>
	let result;

  fetch('http://localhost:8000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'  
      },
      body: JSON.stringify({ message: "svelte" })
    })
    .then(res => res.json())
    .then(({status}) => {
      result = status;
    });
</script>

<style>
	h1 {
		color: purple;
	}
</style>

<h1>{result}</h1>
