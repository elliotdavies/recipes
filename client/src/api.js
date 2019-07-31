const apiUrl = "http://localhost:8000";

export const getRecipes = () => fetch(apiUrl).then(res => res.json());

export const submitRecipe = url =>
  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url })
  });
