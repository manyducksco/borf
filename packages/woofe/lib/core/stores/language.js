import { makeState, joinStates } from "../makeState.js";
import { Store } from "../classes/Store.js";
import { isFunction, isArray } from "../helpers/typeChecking.js";

export class LanguageStore extends Store {
  static about = "Manages translations.";

  setup(ctx) {
    const options = ctx.attrs.get();

    const supportedLanguages = Object.freeze(options.supported || []);
    const translations = options.translations || {};

    const $$language = makeState();
    const $$translation = makeState({});

    // Fallback labels for missing state and data.
    const $noLanguageValue = makeState("[NO LANGUAGE SET]").readable();

    async function fetchTranslation(language) {
      if (!translations[language]) {
        const translation = isFunction(options.fetchTranslation) && (await options.fetchTranslation(language));

        if (translation) {
          translations[language] = translation;
        }
      }

      return translations[language];
    }

    function replaceMustaches(template, values) {
      for (const name in values) {
        template = template.replace(`{{${name}}}`, String(values[name]));
      }
      return template;
    }

    ctx.beforeConnect(async () => {
      const currentLanguage =
        (isFunction(options.default) && (await options.default({ useStore: ctx.useStore }))) ||
        options.default ||
        (isArray(options.supported) && options.supported[0]);

      if (currentLanguage != null) {
        $$language.set(currentLanguage);

        const translation = await fetchTranslation(currentLanguage);
        $$translation.set(translation);
      }
    });

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

          // This looks extremely weird, but it creates a joined state that contains
          // the translation with the latest observable values.
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

            return joinStates($$translation, ...joinArgs);
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
