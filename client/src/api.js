const apiUrl = __API_URL__;

export const getRecipes = () =>
  fetch(apiUrl).then(res => {
    if (res.status !== 200) throw new Error(res);
    else return res.json();
  });

export const submitRecipe = (url, title, notes) =>
  fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ url, title, notes })
  }).then(res => {
    if (res.status !== 201) throw new Error(res);
    else return res.json();
  });

export const updateRecipe = (id, url, title, notes) =>
  fetch(apiUrl, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id, url, title, notes })
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

// tmp

export const getImage = filename =>
  fetch(`${apiUrl}/image/${filename}`).then(res => {
    if (res.status !== 200) throw new Error(res);
    else return res.json();
  });

export const postImage = formData =>
  new Promise((res) => {
    res(formData.get('image').name)
  })
  // fetch(`${apiUrl}/image`, {
  //   method: 'POST',
  //   body: formData
  // }).then(res => {
  //   if (res.status !== 200) throw new Error(res);
  //   else return res.json();
  // });

