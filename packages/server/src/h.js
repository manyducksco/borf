// TODO: Support class arrays, class objects, flatmap children, etc. to match client h() abilities.

export function h(element, ...args) {
  let attributes = {};
  let children;

  if (typeof args[0] === "object" && !Array.isArray(args[0])) {
    attributes = args.shift();
  }

  children = args;

  let init;

  if (typeof element === "string") {
    // Regular HTML element.
    init = async (appContext) => {
      const renderedChildren = await Promise.all(
        children.map((child) => {
          const typeOf = typeof child;

          if (typeOf === "string" || typeOf === "number") {
            return child;
          }

          if (typeOf === "object" && child.isTemplate) {
            return child.init(appContext);
          }
        })
      );

      const renderedAttrs = [];

      for (const key in attributes) {
        renderedAttrs.push(`${key}="${attributes[key]}"`);
      }

      if (renderedAttrs.length > 0) {
        return `<${element} ${renderedAttrs.join(" ")}>${renderedChildren.join("")}</${element}>`;
      } else {
        return `<${element}>${renderedChildren.join("")}</${element}>`;
      }
    };
  } else if (typeof element === "function") {
    // Component. Could be async.

    init = async (appContext) => {
      const self = {
        getService: appContext.getService,
        children,
      };

      let result = element(attributes, self);

      if (typeof result.then === "function") {
        // Async component. Should resolve to a template.
        result = await result;
      }

      if (typeof result === "string") {
        return result;
      } else if (typeof result === "object" && result.isTemplate) {
        return result.init(appContext);
      } else {
        return "";
      }
    };
  }

  return {
    isTemplate: true,
    init,
  };
}
