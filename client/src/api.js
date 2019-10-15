const { apiUrl } = window.recipesConfig;

export const getRecipes = () => fetch(apiUrl).then(res => res.json());

export const submitRecipe = (url, notes) =>
  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url, notes })
  });
