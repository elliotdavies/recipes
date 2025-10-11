export const toFullUrl = (url: string): string =>
  url.startsWith("http") ? url : "http://" + url;

export const sessionIdKey = 'recipes/session_id';

export const getSessionId = (): string | null => localStorage.getItem(sessionIdKey)

export const setSessionId = (session_id: string): void => localStorage.setItem(sessionIdKey, session_id)

export const unsetSessionId = (): void => localStorage.removeItem(sessionIdKey)
