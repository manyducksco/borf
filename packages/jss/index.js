import $$observable from "symbol-observable";
import { create, createRule } from "jss";
import setup from "jss-preset-default";

// // const isObservable = (value) => value && value[$$observable] && value === value[$$observable]();
// const isObservable = (value) => value && typeof value.subscribe === "function";
// const observablePlugin = (updateOptions) => ({
//   onCreateRule(name, decl, options) {
//     if (!isObservable(decl)) return null;

//     const style$ = decl;
//     const rule = createRule(name, {}, options);

//     // TODO
//     // Call `stream.subscribe()` returns a subscription, which should be explicitly
//     // unsubscribed from when we know this sheet is no longer needed.
//     style$.subscribe((style) => {
//       for (const prop in style) {
//         rule.prop(prop, style[prop], updateOptions);
//       }
//     });

//     return rule;
//   },

//   onProcessRule(rule) {
//     if (rule && rule.type !== "style") return;

//     const styleRule = rule;
//     const { style } = styleRule;
//     console.log("style", style);
//     for (const prop in style) {
//       const value = style[prop];
//       console.log({ prop, value, isObservable: !!isObservable(value), x: value[$$observable] });
//       if (!isObservable(value)) continue;
//       delete style[prop];
//       value.subscribe({
//         next: (nextValue) => {
//           console.log({ prop, nextValue, updateOptions });
//           styleRule.prop(prop, nextValue, updateOptions);
//         },
//       });
//     }
//   },
// });

export const jss = create().use(setup());

export function makeStyleSheet(componentContext, styles, options) {
  const sheet = jss.createStyleSheet(styles, { link: hasDynamicStyles(styles), ...options });

  componentContext.beforeConnect(() => sheet.attach());
  componentContext.afterDisconnect(() => sheet.detach());

  return sheet.classes;
}

/**
 * Determine if styles object contains anything dynamic that requires `link: true`.
 * This setting has a performance impact according to the JSS docs, so let's try
 * to avoid turning it on unless there is actually a value that requires it.
 */
function hasDynamicStyles(styles) {
  for (const key in styles) {
    const value = styles[key];

    if (value && value[$$observable] && value === value[$$observable]()) {
      return true;
    }

    if (typeof value === "function") {
      return true;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      if (hasDynamicStyles(value)) {
        return true;
      }
    }
  }

  return false;
}
