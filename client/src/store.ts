import { writable } from "svelte/store";
import type { Recipe } from "./types";
import { getSessionId } from "./utils";

export const recipes = writable<Recipe[]>([]);

export const sessionId = writable<string | null>(getSessionId());
