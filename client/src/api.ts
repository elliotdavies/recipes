import type { Recipe, AuthResponse, ImageUploadResponse } from './types';

const apiUrl = __API_URL__;

export const getRecipes = (session_id: string): Promise<Recipe[]> =>
  fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${session_id}`
    }
  }).then(res => {
    if (res.status !== 200) throw new Error(String(res));
    else return res.json();
  });

export const submitRecipe = (
  session_id: string,
  recipe: Omit<Recipe, 'id'>
): Promise<Recipe> =>
  fetch(apiUrl, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${session_id}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(recipe)
  }).then(res => {
    if (res.status !== 201) throw new Error(String(res));
    else return res.json();
  });

export const updateRecipe = (
  session_id: string,
  recipe: Recipe
): Promise<Response> =>
  fetch(apiUrl, {
    method: "PUT",
    headers: {
      'Authorization': `Bearer ${session_id}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(recipe)
  }).then(res => {
    if (res.status !== 204) throw new Error(String(res));
    else return res;
  });

export const deleteRecipe = (session_id: string, id: string): Promise<Response> =>
  fetch(apiUrl, {
    method: "DELETE",
    headers: {
      'Authorization': `Bearer ${session_id}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id })
  }).then(res => {
    if (res.status !== 204) throw new Error(String(res));
    else return res;
  });

export const postImage = (session_id: string, formData: FormData): Promise<string> =>
  fetch(`${apiUrl}/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session_id}`,
    },
    body: formData
  }).then(res => {
    if (res.status !== 200) throw new Error(String(res));
    else return res.json();
  }).then((json: ImageUploadResponse) => json.filename);

export const signUp = (name: string, email: string, password: string): Promise<AuthResponse> =>
  fetch(`${apiUrl}/sign-up`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, password })
  }).then(res => {
    if (res.status !== 200) {
      res.text().then(err => {
        throw new Error(err);
      })
    }
    else return res.json();
  });

export const signIn = (email: string, password: string): Promise<AuthResponse> =>
  fetch(`${apiUrl}/sign-in`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  }).then(res => {
    if (res.status !== 200) {
      res.text().then(err => {
        throw new Error(err);
      })
    }
    else return res.json();
  });

export const signOut = (session_id: string): Promise<void> =>
  fetch(`${apiUrl}/sign-out`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session_id}`,
    }
  }).then(res => {
    if (res.status !== 200) {
      res.text().then(err => {
        throw new Error(err);
      })
    }
  })
