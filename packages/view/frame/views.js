/**
 * This file runs inside the view iframe. It exposes methods on the window so the main runner app can control it.
 */
// views-index.js is generated from the views in the project
import views from "./views-index.js";
import { h, makeState, mergeStates } from "@woofjs/client";
import { makeDebug, initService, catchLinks } from "@woofjs/client/helpers";

function makeMockRouter() {
  return {
    $path: makeState("/test").map(),
    $route: makeState("/test").map(),
    $params: makeState({}).map(),
    $query: makeState({}),

    back() {},
    forward() {},
    navigate() {},
  };
}

function makeMockPage() {
  return {
    $title: makeState("Page Title"),
  };
}

const collections = [];

let nextId = 0;

function formatCollection(data) {
  const path = getCollectionPath(data);

  const collection = {
    path: path,
    name: path.split("/").pop(),
    views: [],
  };

  const fns = [];

  if (typeof data.exports === "object" && !Array.isArray(data.exports)) {
    for (const key in data.exports) {
      fns.push({ fn: data.exports[key], name: sentenceCase(key) });
    }
  } else if (typeof data.exports === "function") {
    fns.push({ fn: data.exports, name: "@default" });
  } else {
    throw new Error(
      `View files must export a function or object. Got: ${typeof data.exports}`
    );
  }

  for (const { fn, name } of fns) {
    const services = {};
    const attributes = [];
    const actions = { $log: makeState([]), fns: [] };
    let template;

    const helpers = {
      name: sentenceCase(name),
      description: null,
      service(name, service, config = {}) {
        if (typeof service === "function") {
          services[name] = {
            fn: service,
            options: config.options || {},
          };
        } else if (typeof service === "object" && !Array.isArray(service)) {
          services[name] = {
            fn: () => service,
            options: {},
          };
        } else {
          throw new TypeError(
            `Expected service '${name}' to be a function or object. Got: ${typeof service}`
          );
        }
      },
      attribute(value, options = {}) {
        return {
          isViewAttribute: true,
          value,
          options,
        };
      },
      action(message, callback) {
        return {
          isViewAction: true,
          message,
          callback,
        };
      },
      fireAction(message) {
        actions.$log.set((log) => {
          log.push({
            timestamp: new Date(),
            message: message,
            name: "fired",
          });
        });
      },
      render(component, attrs, children) {
        template = h(component, attrs, children);
      },
    };

    const result = fn.call(helpers, helpers);

    if (result && result.isTemplate) {
      template = result;
    }

    // Process attributes and actions.
    for (const name in template.attrs) {
      const attr = template.attrs[name];

      if (attr.isViewAttribute) {
        const $value = attr.value.isState ? attr.value : makeState(attr.value);

        attributes.push({
          name: attr.options?.name || name,
          description: attr.options?.description,
          key: name,
          input: attr.options?.input || autoInput($value.get()),
          $value,
        });

        // Replace attribute with the state.
        template.attrs[name] = $value;
      }

      if (attr.isViewAction) {
        const handler = (...args) => {
          // Push to action log.
          actions.$log.set((log) => {
            log.push({
              timestamp: new Date(),
              message: attr.message,
              name,
            });
          });

          // Fire callback and return its return value to the caller.
          if (attr.callback) {
            return attr.callback(...args);
          }
        };

        actions.fns.push(handler);
        template.attrs[name] = handler;
      }
    }

    if (!template) {
      throw new Error(`View must return a template.`);
    }

    collection.views.push({
      id: nextId++,
      path:
        helpers.name === "@default"
          ? collection.path
          : joinPath(collection.path, slugCase(helpers.name)),
      name: helpers.name,
      description: helpers.description,
      attributes,
      services,
      actions,
      template,
      component: null,
    });
  }

  return collection;
}

for (const view of views) {
  collections.push(formatCollection(view));
}

const root = document.querySelector("#view");

let handlers = {};
let mounted;
let activeView;

catchLinks(root, (anchor) => {
  if (activeView) {
    const url = new URL(anchor.href);

    // Log navigation as an action.
    activeView.actions.$log.set((log) => {
      log.push({
        timestamp: new Date(),
        message: `to: ${url.pathname}`,
        name: "navigate",
      });
    });

    console.log({ activeView, url });
  }
});

function emitEvent(name, ...args) {
  if (handlers[name]) {
    for (const callback of handlers[name]) {
      callback(...args);
    }
  }
}

const api = {
  onEvent(name, callback) {
    handlers[name] = handlers[name] || [];
    handlers[name].push(callback);

    return function cancel() {
      handlers[name].splice(handlers[name].indexOf(callback), 1);
    };
  },
  getCollections() {
    return collections;
  },
  setActiveView(id) {
    if (mounted) {
      mounted.disconnect();
      mounted = null;
      emitEvent("unmount");
    }

    if (activeView) {
      activeView = null;
    }

    if (id != null) {
      let found;

      outer: for (const collection of collections) {
        for (const view of collection.views) {
          if (view.id === id) {
            found = view;
            break outer;
          }
        }
      }

      if (!found) {
        throw new Error(`View not found.`);
      }

      activeView = found;

      const debug = makeDebug();
      const appContext = { makeGetService };

      const services = {
        "@app": { exports: appContext },
        "@debug": { exports: debug },
        "@router": { exports: makeMockRouter() },
        "@page": { exports: makeMockPage() },
      };

      for (const name in found.services) {
        const service = found.services[name];

        services[name] = initService(
          { makeGetService },
          service.fn,
          debug.makeChannel(`service:${name}`),
          { options: service.options }
        );
      }

      function makeGetService() {
        return (name) => {
          if (services[name]) {
            return services[name].exports;
          }

          throw new Error(
            `Service '${name}' was requested but hasn't been defined in this view.`
          );
        };
      }

      mounted = found.template.init({ makeGetService });

      for (const name in services) {
        if (services[name].beforeConnect) {
          services[name].beforeConnect();
        }
      }

      mounted.connect(root);

      for (const name in services) {
        if (services[name].afterConnect) {
          services[name].afterConnect();
        }
      }

      emitEvent("mount", mounted);
    }
  },
};

window.WOOF_VIEW = api;

// Support camel case ("camelCase" -> "camel Case" and "CAMELCase" -> "CAMEL Case").
const SPLIT_REGEXP = [/([a-z0-9])([A-Z])/g, /([A-Z])([A-Z][a-z])/g];

// Remove all non-word characters.
const STRIP_REGEXP = /[^A-Z0-9]+/gi;

function sentenceCase(input) {
  let result = input
    .replace(SPLIT_REGEXP, "$1\0$2")
    .replace(STRIP_REGEXP, "\0");

  let start = 0;
  let end = result.length;

  // Trim the delimiter from around the output string.
  while (result.charAt(start) === "\0") {
    start++;
  }
  while (result.charAt(end - 1) === "\0") {
    end--;
  }

  // Transform each token independently.
  result = result
    .slice(start, end)
    .split("\0")
    .map((word) => word.toLowerCase())
    .join(" ");

  result = result[0].toUpperCase() + result.slice(1);

  return result;
}

function slugCase(input) {
  let result = input
    .replace(SPLIT_REGEXP, "$1\0$2")
    .replace(STRIP_REGEXP, "\0");

  let start = 0;
  let end = result.length;

  // Trim the delimiter from around the output string.
  while (result.charAt(start) === "\0") {
    start++;
  }
  while (result.charAt(end - 1) === "\0") {
    end--;
  }

  // Transform each token independently.
  result = result
    .slice(start, end)
    .split("\0")
    .map((word) => word.toLowerCase())
    .join("-");

  return result;
}

function joinPath(...parts) {
  let url = "";

  for (let part of parts) {
    if (!part.startsWith("/")) {
      part = "/" + part;
    }

    if (part.endsWith("/")) {
      part = part.slice(0, part.length - 1);
    }

    url += part;
  }

  return url;
}

function autoInput(value) {
  if (typeof value === "string") {
    return { type: "text" };
  }

  if (typeof value === "number") {
    return { type: "number" };
  }

  if (typeof value === "boolean") {
    return { type: "toggle" };
  }

  if (typeof value === "object" && typeof value.getDate === "function") {
    return { type: "date" };
  }

  // Objects, arrays, functions and other types have no default input.
  return { type: "none" };
}

/**
 * Calculate the final path the collection will be accessed at.
 */
function getCollectionPath(collection) {
  const segments = collection.relativePath
    .split("/")
    .filter((segment) => segment.trim() !== "");

  const filename = segments.pop();
  const filebase = filename.replace(/\.view\.[jt]sx?$/, "");

  // If file's name is "index" or the same as the folder, chop it.
  if (filebase === "index" || filebase === segments[segments.length - 1]) {
    return "/" + segments.join("/");
  } else {
    return "/" + [...segments, filebase].join("/");
  }
}
