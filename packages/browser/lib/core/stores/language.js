import { Type } from "../../../../bedrock/lib";
import { State } from "../classes/State.js";
import { Store } from "../classes/Store.js";

class Language {
  #tag;
  #config;
  #translation;

  get tag() {
    return this.#tag;
  }

  constructor(tag, config) {
    this.#tag = tag;
    this.#config = config;
  }

  async getTranslation() {
    if (!this.#translation) {
      // Translation can be an object of strings, a function that returns one, or an async function that resolves to one.
      if (Type.isFunction(this.#config.translation)) {
        const result = this.#config.translation();

        if (Type.isPromise(result)) {
          const resolved = await result;

          Type.assertObject(
            resolved,
            `Translation promise of language '${
              this.#tag
            }' must resolve to an object of translated strings. Got type: %t, value: %v`
          );

          this.#translation = resolved;
        } else if (Type.isObject(result)) {
          this.#translation = result;
        } else {
          throw new TypeError(
            `Translation function of '${this.#tag}' must return an object or promise. Got type: ${Type.of(
              result
            )}, value: ${result}`
          );
        }
      } else if (Type.isObject(this.#config.translation)) {
        this.#translation = this.#config.translation;
      } else {
        throw new TypeError(
          `Translation of '${
            this.#tag
          }' must be an object of translated strings, a function that returns one, or an async function that resolves to one. Got type: ${Type.of(
            this.#config.translation
          )}, value: ${this.#config.translation}`
        );
      }
    }

    return this.#translation;
  }
}

export const LanguageStore = Store.define({
  label: "language",
  about: "Manages translations.",
  async setup(ctx) {
    const options = ctx.inputs.get();
    const languages = new Map();

    // Convert languages into Language instances.
    Object.entries(options.languages || {}).forEach(([tag, config]) => {
      languages.set(tag, new Language(tag, config));
    });

    ctx.log(
      `This app supports ${languages.size} language${languages.size === 1 ? "" : "s"}: ${[...languages.keys()].join(
        ", "
      )}`
    );

    const $$language = new State(); // String
    const $$translation = new State(); // Object

    // Fallback labels for missing state and data.
    const $noLanguageValue = new State("[NO LANGUAGE SET]").readable();

    /**
     * Replaces {{placeholders}} with values in translated strings.
     */
    function replaceMustaches(template, values) {
      for (const name in values) {
        template = template.replace(`{{${name}}}`, String(values[name]));
      }
      return template;
    }

    // TODO: Determine and load default language.
    const currentLanguage = options.currentLanguage
      ? languages.get(options.currentLanguage)
      : languages.get([...languages.keys()][0]);

    if (currentLanguage != null) {
      const translation = await currentLanguage.getTranslation();

      $$language.set(currentLanguage.tag);
      $$translation.set(translation);
    }

    return {
      $currentLanguage: $$language.readable(),
      supportedLanguages: [...languages.keys()],

      async setLanguage(tag) {
        if (!languages.has(tag)) {
          throw new Error(`Language '${tag}' is not supported.`);
        }

        const lang = languages.get(tag);

        try {
          const translation = await lang.getTranslation();

          $$language.set(tag);
          $$translation.set(translation);
        } catch (error) {
          ctx.crash(error);
        }
      },

      /**
       * Returns a Readable of the translated value.

       * @param key - Key to the translated value.
       * @param values - A map of {{placeholder}} names and the values to replace them with.
       */
      translate(key, values = null) {
        if ($$language.get() == null) {
          return $noLanguageValue;
        }

        if (values) {
          const observableValues = {};

          for (const [key, value] of Object.entries(values)) {
            if (typeof value?.subscribe === "function") {
              observableValues[key] = value;
            }
          }

          // This looks extremely weird, but it creates a joined state
          // that contains the translation with interpolated observable values.
          const observableEntries = Object.entries(observableValues);
          if (observableEntries.length > 0) {
            const merge = (t, ...entryValues) => {
              const entries = entryValues.map((_, i) => observableEntries[i]);
              const mergedValues = {
                ...values,
              };

              for (let i = 0; i < entries.length; i++) {
                const key = entries[i][0];
                mergedValues[key] = entryValues[i];
              }

              const result = resolve(t, key) || `[NO TRANSLATION: ${key}]`;
              return replaceMustaches(result, mergedValues);
            };

            const joinArgs = [...observableEntries.map((x) => x[1]), merge];

            return State.merge($$translation, ...joinArgs);
          }
        }

        return $$translation.as((t) => {
          let result = resolve(t, key) || `[NO TRANSLATION: ${key}]`;

          if (values) {
            result = replaceMustaches(result, values);
          }

          return result;
        });
      },
    };
  },
});

function resolve(object, key) {
  const parsed = String(key)
    .split(/[\.\[\]]/)
    .filter((part) => part.trim() !== "");
  let value = object;

  while (parsed.length > 0) {
    const part = parsed.shift();

    if (value != null) {
      value = value[part];
    } else {
      value = undefined;
    }
  }

  return value;
}
