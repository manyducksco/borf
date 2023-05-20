import type { Stringable } from "../types";

import { assertObject, isFunction, isObject, isPromise, typeOf } from "@borf/bedrock";
import { Readable } from "../classes/Readable.js";
import { Writable } from "../classes/Writable.js";
import { type ComponentContext } from "../component.js";

// ----- Types ----- //

// TODO: Is there a good way to represent infinitely nested recursive types?
/**
 * An object where values are either a translated string or another nested Translation object.
 */
type Translation = Record<string, string | Record<string, string | Record<string, string | Record<string, string>>>>;

export interface LanguageConfig {
  /**
   * The translated strings for this language, or a callback function that returns them.
   */
  translation: Translation | (() => Translation) | (() => Promise<Translation>);
}

type LanguageAttrs = {
  /**
   * Languages supported by the app (as added with App.addLanguage)
   */
  languages: {
    [tag: string]: LanguageConfig;
  };

  /**
   * Default language to load on startup
   */
  currentLanguage: string;
};

// ----- Code ----- //

export async function LanguageStore(attrs: LanguageAttrs, ctx: ComponentContext) {
  ctx.name = "borf:language";

  const languages = new Map<string, Language>();

  // Convert languages into Language instances.
  Object.entries(attrs.languages).forEach(([tag, config]) => {
    languages.set(tag, new Language(tag, config));
  });

  ctx.info(
    `app supports ${languages.size} language${languages.size === 1 ? "" : "s"}: '${[...languages.keys()].join("', '")}'`
  );

  const $$language = new Writable<string | undefined>(undefined);
  const $$translation = new Writable<Translation | undefined>(undefined);

  // Fallback labels for missing state and data.
  const $noLanguageValue = new Readable("[NO LANGUAGE SET]");

  /**
   * Replaces {{placeholders}} with values in translated strings.
   */
  function replaceMustaches(template: string, values: Record<string, Stringable>) {
    for (const name in values) {
      template = template.replace(`{{${name}}}`, String(values[name]));
    }
    return template;
  }

  // TODO: Determine and load default language.
  const currentLanguage = attrs.currentLanguage
    ? languages.get(attrs.currentLanguage)
    : languages.get([...languages.keys()][0]);

  if (currentLanguage != null) {
    ctx.info(`current language is '${currentLanguage.tag}'`);

    const translation = await currentLanguage.getTranslation();

    $$language.value = currentLanguage.tag;
    $$translation.value = translation;
  }

  return {
    $currentLanguage: $$language.toReadable(),
    supportedLanguages: [...languages.keys()],

    async setLanguage(tag: string) {
      if (!languages.has(tag)) {
        throw new Error(`Language '${tag}' is not supported.`);
      }

      const lang = languages.get(tag)!;

      try {
        const translation = await lang.getTranslation();

        $$language.value = tag;
        $$translation.value = translation;

        ctx.info("set language to " + tag);
      } catch (error) {
        if (error instanceof Error) {
          ctx.crash(error);
        }
      }
    },

    /**
     * Returns a Readable of the translated value.

     * @param key - Key to the translated value.
     * @param values - A map of {{placeholder}} names and the values to replace them with.
     */
    translate(key: string, values?: Record<string, Stringable | Readable<Stringable>>): Readable<string> {
      if (!$$language.value) {
        return $noLanguageValue;
      }

      if (values) {
        const readableValues: Record<string, Readable<any>> = {};

        for (const [key, value] of Object.entries<any>(values)) {
          if (typeof value?.observe === "function") {
            readableValues[key] = value;
          }
        }

        // This looks extremely weird, but it creates a joined state
        // that contains the translation with interpolated observable values.
        const readableEntries = Object.entries(readableValues);
        if (readableEntries.length > 0) {
          return Readable.merge([$$translation, ...readableEntries.map((x) => x[1])], (t, ...entryValues) => {
            const entries = entryValues.map((_, i) => readableEntries[i]);
            const mergedValues = {
              ...values,
            };

            for (let i = 0; i < entries.length; i++) {
              const key = entries[i][0];
              mergedValues[key] = entryValues[i];
            }

            const result = resolve(t, key) || `[NO TRANSLATION: ${key}]`;
            return replaceMustaches(result, mergedValues);
          });
        }
      }

      return $$translation.map((t) => {
        let result = resolve(t, key) || `[NO TRANSLATION: ${key}]`;

        if (values) {
          result = replaceMustaches(result, values);
        }

        return result;
      });
    },
  };
}

function resolve(object: any, key: string) {
  const parsed = String(key)
    .split(/[\.\[\]]/)
    .filter((part) => part.trim() !== "");
  let value = object;

  while (parsed.length > 0) {
    const part = parsed.shift()!;

    if (value != null) {
      value = value[part];
    } else {
      value = undefined;
    }
  }

  return value;
}

class Language {
  #tag;
  #config;
  #translation?: Translation;

  get tag() {
    return this.#tag;
  }

  constructor(tag: string, config: LanguageConfig) {
    this.#tag = tag;
    this.#config = config;
  }

  async getTranslation() {
    if (!this.#translation) {
      // Translation can be an object of strings, a function that returns one, or an async function that resolves to one.
      if (isFunction(this.#config.translation)) {
        const result = this.#config.translation();

        if (isPromise(result)) {
          const resolved = await result;

          assertObject(
            resolved,
            `Translation promise of language '${
              this.#tag
            }' must resolve to an object of translated strings. Got type: %t, value: %v`
          );

          this.#translation = resolved;
        } else if (isObject(result)) {
          this.#translation = result;
        } else {
          throw new TypeError(
            `Translation function of '${this.#tag}' must return an object or promise. Got type: ${typeOf(
              result
            )}, value: ${result}`
          );
        }
      } else if (isObject(this.#config.translation)) {
        this.#translation = this.#config.translation;
      } else {
        throw new TypeError(
          `Translation of '${
            this.#tag
          }' must be an object of translated strings, a function that returns one, or an async function that resolves to one. Got type: ${typeOf(
            this.#config.translation
          )}, value: ${this.#config.translation}`
        );
      }
    }

    return this.#translation;
  }
}
