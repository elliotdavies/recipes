const apiUrl = __API_URL__;

export const getRecipes = () =>
  fetch(apiUrl).then(res => {
    if (res.status !== 200) throw new Error(res);
    else return res.json();
  });

export const submitRecipe = (url, title, notes, images) =>
  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url, title, notes, images })
  }).then(res => {
    if (res.status !== 201) throw new Error(res);
    else return res.json();
  });

export const updateRecipe = (id, url, title, notes, images) =>
  fetch(apiUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id, url, title, notes, images })
  }).then(res => {
    if (res.status !== 204) throw new Error(res);
    else return res;
  });

export const deleteRecipe = id =>
  fetch(apiUrl, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id })
  }).then(res => {
    if (res.status !== 204) throw new Error(res);
    else return res;
  });

export const postImage = formData =>
  fetch(`${apiUrl}/image`, {
    method: 'POST',
    body: formData
  }).then(res => {
    if (res.status !== 200) throw new Error(res);
    else return res.json();
  }).then(json => json.filename);

export const loginWithGoogle = (email, name) =>
  fetch(`${apiUrl}/login/google`, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, name })
  }).then(res => {
    if (res.status !== 200) {
      res.text().then(err => {
        throw new Error(err);
      })
    }
    else return res.json();
  }).then(json => json.session_id);

export const logout = () =>
  fetch(`${apiUrl}/logout`, {
    method: 'POST',
  }).then(res => {
    if (res.status !== 200) {
      res.text().then(err => {
        throw new Error(err);
      })
    }
  })
