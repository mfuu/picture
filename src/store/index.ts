import { writable } from "svelte/store";

export const storeImageUrl = writable('');
export const storeCurrentImage = writable(null);