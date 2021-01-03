const apiUrl = __API_URL__;

export const getRecipes = (session_id) =>
  fetch(apiUrl, {
    headers: {
      'Authorization': `Bearer ${session_id}`
    }
  }).then(res => {
    if (res.status !== 200) throw new Error(res);
    else return res.json();
  });

export const submitRecipe = (session_id, url, title, notes, images) =>
  fetch(apiUrl, {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${session_id}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url, title, notes, images })
  }).then(res => {
    if (res.status !== 201) throw new Error(res);
    else return res.json();
  });

export const updateRecipe = (session_id, id, url, title, notes, images) =>
  fetch(apiUrl, {
    method: "PUT",
    headers: {
      'Authorization': `Bearer ${session_id}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id, url, title, notes, images })
  }).then(res => {
    if (res.status !== 204) throw new Error(res);
    else return res;
  });

export const deleteRecipe = (session_id, id) =>
  fetch(apiUrl, {
    method: "DELETE",
    headers: {
      'Authorization': `Bearer ${session_id}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id })
  }).then(res => {
    if (res.status !== 204) throw new Error(res);
    else return res;
  });

export const postImage = (session_id, formData) =>
  fetch(`${apiUrl}/image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session_id}`,
    },
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

export const logout = (session_id) =>
  fetch(`${apiUrl}/logout`, {
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
