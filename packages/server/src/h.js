import { isArray, isFunction, isNumber, isObject, isString, isTemplate } from "./helpers/typeChecking";
import { flatMap } from "./helpers/flatMap";

const booleanAttrs = [
  "autocomplete",
  "autofocus",
  "checked",
  "contenteditable",
  "disabled",
  "draggable",
  "hidden",
  "multiple",
  "readonly",
  "required",
  "spellcheck",
  "translate",
];

export function h(element, ...args) {
  let attributes = {};
  let children;

  if (isObject(args[0]) && !isTemplate(args[0])) {
    attributes = args.shift();
  }

  children = flatMap(args);

  let init;

  if (isString(element)) {
    // Regular HTML element.
    init = async (appContext) => {
      const renderedChildren = await Promise.all(
        children.map((child) => {
          if (isString(child) || isNumber(child)) {
            return child;
          }

          if (isTemplate(child)) {
            return child.init(appContext);
          }
        })
      );

      const renderedAttrs = [];

      for (const key in attributes) {
        if (key === "class") {
          renderedAttrs.push(renderClasses(attributes[key]));
          continue;
        }

        if (key.startsWith("on") && isFunction(attributes[key])) {
          throw new TypeError(
            `Event handler functions are not supported in server rendered pages. Got function for '${key}'`
          );
        }

        if (booleanAttrs.includes(key)) {
          renderedAttrs.push(key);
          continue;
        }

        renderedAttrs.push(`${key}="${attributes[key]}"`);
      }

      if (renderedAttrs.length > 0) {
        return `<${element} ${renderedAttrs.join(" ")}>${renderedChildren.join("")}</${element}>`;
      } else {
        return `<${element}>${renderedChildren.join("")}</${element}>`;
      }
    };
  } else if (isFunction(element)) {
    // Component. Could be async.

    init = async (appContext) => {
      const ctx = {
        attrs: attributes,
        services: appContext.services,
        children,
        debug: appContext.debug.makeChannel(`component:${element.name || "?"}`),
      };

      let result = element.call(ctx, ctx);

      if (result === undefined) {
        throw new TypeError(
          `Component '${element.name}' must return an element, or if you want to render nothing return null to make this explicit.`
        );
      }

      if (isFunction(result?.then)) {
        // Async component. Should resolve to a template.
        result = await result;
      }

      if (isString(result)) {
        return result;
      }

      if (isTemplate(result)) {
        return result.init(appContext);
      }

      return "";
    };
  }

  return {
    isTemplate: true,
    init,
  };
}

function getClassMap(classes) {
  let classMap = {};

  if (isString(classes)) {
    // Support multiple classes in one string like HTML.
    const names = classes.split(" ");
    for (const name of names) {
      classMap[name] = true;
    }
  } else if (isObject(classes)) {
    Object.assign(classMap, classes);
  } else if (isArray(classes)) {
    Array.from(classes)
      .filter((item) => item != null)
      .forEach((item) => {
        Object.assign(classMap, getClassMap(item));
      });
  }

  return classMap;
}

function renderClasses(classes) {
  const classMap = getClassMap(classes);

  let classList = [];

  for (const name in classMap) {
    if (!!classMap[name]) {
      classList.push(name);
    }
  }

  return `class="${classList.join(" ")}"`;
}
