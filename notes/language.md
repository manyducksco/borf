# Language Store

Add a new built in store called "language" that tracks the current language and supplies translations.

```jsx
makeApp({
  language: {
    supported: ["ja", "en"],
    default: "en",

    // Supply a function to retrieve the default value with an async function.
    default: async (ctx) => {
      // Note: ctx contains just 'useStore' here
      const loaded = await Preferences.get({ key: "example-app-preference" });
      return loaded.value;
    },

    // Specify translations inline. These will be loaded first.
    translations: {
      ja: {
        greeting: "ようこそ",
      },
      en: {
        greeting: "Welcome",
      },
    },

    // Or specify a fetch function to retrieve any that aren't in 'translations'.
    fetchTranslation: async (ctx, language) => {
      const http = ctx.useStore("http");
      const res = await http.get(`/translations/${language}.json`);
      return res.body;
    },
  },
});

const { t, setLanguage, $currentLanguage, supportedLanguages } =
  ctx.useStore("language");

// Get a readable binding to a translation key.
t("greeting");
```
