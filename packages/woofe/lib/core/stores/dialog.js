import { makeState } from "../makeState.js";
import { APP_CONTEXT } from "../keys.js";
import { Store } from "../classes/Store.js";
import { Markup } from "../classes/Markup.js";
import { View } from "../classes/View.js";
import { isFunction, isView } from "../helpers/typeChecking.js";

/**
 * Manages dialogs. Also known as modals.
 * TODO: Describe this better.
 */
export class DialogStore extends Store {
  setup(ctx) {
    /**
     * A first-in-last-out queue of dialogs. The last one appears on top.
     * This way if a dialog opens another dialog the new dialog stacks.
     */
    const $$dialogs = makeState([]);

    // Add $dialogs to app context so the app can display them.
    ctx[APP_CONTEXT].$dialogs = $$dialogs.readable();

    return {
      open: (view, attributes) => openDialog(view, attributes, ctx, $$dialogs),
    };
  }
}

function openDialog(view, attributes, ctx, $$dialogs) {
  let markup;

  if (isFunction(view)) {
    markup = new Markup((config) => new View({ ...config, setup: view }));
  } else if (isView(view)) {
    markup = new Markup((config) => new view(config));
  }

  if (!markup) {
    throw new TypeError(`Expected a view or setup function. Got: ${view}`);
  }

  const $$open = makeState(true);

  const view = markup.init({
    appContext: ctx[APP_CONTEXT],
    attributes: {
      ...attributes,
      open: $$open,
    },
  });
  $$dialogs.update((current) => {
    current.push(view);
  });

  const openSubscription = $$open.subscribe((value) => {
    if (!value) {
      close();
    }
  });

  return function close() {
    $$dialogs.update((current) => {
      current.splice(
        current.findIndex((v) => v === view),
        1
      );
    });
    view = null;

    openSubscription.unsubscribe();
  };
}
