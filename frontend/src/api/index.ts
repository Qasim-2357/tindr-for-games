import { realApi } from "./client";
import { mockApi } from "./mock";

export const IS_MOCK = import.meta.env.VITE_MOCK === "true";
export const api = IS_MOCK ? mockApi : realApi;
export { ApiError } from "./client";
