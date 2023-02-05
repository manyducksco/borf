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
      open: (view, inputs) => openDialog(view, inputs, ctx, $$dialogs),
    };
  }
}

function openDialog(view, inputs, ctx, $$dialogs) {
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

  let instance = markup.init({
    appContext: ctx[APP_CONTEXT],
    inputs: {
      ...inputs,
      open: $$open,
    },
  });
  $$dialogs.update((current) => {
    current.push(instance);
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
    instance = null;

    openSubscription.unsubscribe();
  };
}
