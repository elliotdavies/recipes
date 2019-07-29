const url = "http://localhost:8000";

export const getRecipes = () => fetch(url).then(res => res.json());

export const submitRecipe = text =>
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ text })
  });
