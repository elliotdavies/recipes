import { writable } from "svelte/store";
import { getSessionId } from './utils'

export const recipes = writable([]);

export const sessionId = writable(getSessionId());
