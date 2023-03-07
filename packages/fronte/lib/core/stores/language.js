import { Type } from "@frameworke/bedrocke";
import { State } from "../classes/State.js";
import { Store } from "../classes/Store.js";

export class LanguageStore extends Store {
  static about = "Manages translations.";

  async setup(ctx) {
    const options = ctx.inputs.get();

    const supportedLanguages = Object.freeze(options.supported || []);
    const translations = options.translations || {};

    const $$language = new State();
    const $$translation = new State({});

    // Fallback labels for missing state and data.
    const $noLanguageValue = new State("[NO LANGUAGE SET]").readable();

    /**
     * Retrieves the key-value store with translated strings for the requested language.
     * Tries to load from cache first, fetching with `options.fetchTranslation` if there is none cached.
     */
    async function fetchTranslation(language) {
      if (!translations[language]) {
        const translation = Type.isFunction(options.fetchTranslation) && (await options.fetchTranslation(language));

        if (translation) {
          translations[language] = translation;
        }
      }

      return translations[language];
    }

    /**
     * Replaces {{placeholders}} with values in translated strings.
     */
    function replaceMustaches(template, values) {
      for (const name in values) {
        template = template.replace(`{{${name}}}`, String(values[name]));
      }
      return template;
    }

    const currentLanguage =
      (Type.isFunction(options.default) && (await options.default({ useStore: ctx.useStore }))) ||
      options.default ||
      (Type.isArray(options.supported) && options.supported[0]);

    if (currentLanguage != null) {
      $$language.set(currentLanguage);

      const translation = await fetchTranslation(currentLanguage);
      $$translation.set(translation);
    }

    return {
      $currentLanguage: $$language.readable(),
      supportedLanguages,

      async setLanguage(language) {
        if (!supportedLanguages.includes(language)) {
          throw new Error(`Language '${language}' is not supported.`);
        }

        const translation = await fetchTranslation(language);

        $$language.set(language);
        $$translation.set(translation);
      },

      /**
       * Returns a Readable of the translated value.

       * @param key - Key to the translated value.
       * @param values - A map of {{placeholder}} names and the values to replace them with.
       */
      t(key, values = null) {
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
  }
}

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
