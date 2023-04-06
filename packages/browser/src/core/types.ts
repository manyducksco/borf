import { type HTTPStore } from "./stores/http.js";
import { type DialogStore } from "./stores/dialog.js";
import { type LanguageStore } from "./stores/language.js";
import { type PageStore } from "./stores/page.js";
import { type RouterStore } from "./stores/router.js";
import { type StoreConstructor } from "./classes/Store.js";

type StoreOutput<T> = T extends StoreConstructor<any, infer O> ? (O extends Promise<infer U> ? U : O) : unknown;

export interface BuiltInStores {
  http: StoreOutput<typeof HTTPStore>;
  dialog: StoreOutput<typeof DialogStore>;
  language: StoreOutput<typeof LanguageStore>;
  page: StoreOutput<typeof PageStore>;
  router: StoreOutput<typeof RouterStore>;
}
