export const toFullUrl = url =>
  url.startsWith("http") ? url : "http://" + url;

export const sessionIdKey = 'recipes/session_id';

export const getSessionId = () => localStorage.getItem(sessionIdKey)

export const setSessionId = (session_id) => localStorage.setItem(sessionIdKey, session_id)

export const unsetSessionId = () => localStorage.removeItem(sessionIdKey)
