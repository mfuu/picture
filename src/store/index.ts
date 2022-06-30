import { writable } from "svelte/store";

export const storeToolbarClick = writable(null)
export const storeImageUrl = writable('');
export const storeCurrentImage = writable(null);