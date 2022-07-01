import { writable } from "svelte/store";

export const storeToolbarClick = writable(null); // 当前点击的 toolbar
export const storeImageUrl = writable(''); // 选中的文件
export const storeCurrentImage = writable(null); // 与显示的图片信息保持一致