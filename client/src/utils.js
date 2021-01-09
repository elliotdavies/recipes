export const toFullUrl = url =>
  url.startsWith("http") ? url : "http://" + url;
