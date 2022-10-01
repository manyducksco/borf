import { makeView } from "../makeView.js";
import { makeState } from "../helpers/makeState.js";
import { isArray, isTemplate } from "../helpers/typeChecking.js";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "../keys.js";

/**
 * Displays a dynamic list based on an array stored in a `value` attribute.
 */
export const Repeater = makeView((ctx) => {
  ctx.name = "Repeater";
  ctx.defaultState = {
    value: [],
    render: null,
    getKey: null,
  };

  const node = document.createComment("woof:repeat");

  const appContext = ctx[APP_CONTEXT];
  const elementContext = ctx[ELEMENT_CONTEXT];
  const renderFn = ctx.get("render");
  const getKey = ctx.get("getKey") || ((v) => v);

  let connectedItems = [];

  function cleanup() {
    for (const connected of connectedItems) {
      connected.element.disconnect();
    }
    connectedItems = [];
  }

  ctx.observe("value", (newValues) => {
    if (newValues == null) {
      return cleanup();
    }

    if (!isArray(newValues)) {
      throw new TypeError(`Repeat expects an array. Got: ${typeof newValues}`);
    }

    const potentialItems = newValues.map((value, index) => {
      return { key: getKey(value, index), value, index };
    });
    const newItems = [];

    // Disconnect views for items that no longer exist.
    for (const connected of connectedItems) {
      const stillPresent = !!potentialItems.find((p) => p.key === connected.key);

      if (!stillPresent) {
        connected.element.disconnect();
      }
    }

    // Add new views and update state for existing ones.
    for (const potential of potentialItems) {
      const connected = connectedItems.find((item) => item.key === potential.key);

      if (connected) {
        connected.state.set({
          value: potential.value,
          index: potential.index,
        });
        newItems[potential.index] = connected;
      } else {
        const [state] = makeState({});
        state.set({
          value: potential.value,
          index: potential.index,
        });
        const element = renderFn(state.readable("value"), state.readable("index"));

        if (!isTemplate(element)) {
          throw new TypeError(`Repeat render function must return a template.`);
        }

        newItems[potential.index] = {
          key: potential.key,
          state,
          element: element.init({ appContext, elementContext }),
        };
      }
    }

    // Reconnect to ensure order. Lifecycle hooks won't be run again if the window is already connected.
    for (const item of newItems) {
      item.element.connect(node.parentNode);
    }

    connectedItems = newItems;
  });

  ctx.afterDisconnect(cleanup);

  return node;
});
