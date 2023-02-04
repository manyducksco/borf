import { makeState } from "../makeState.js";
import { APP_CONTEXT } from "../keys.js";
import { Store } from "../classes/Store.js";
import { Markup } from "../classes/Markup.js";
import { View } from "../classes/View.js";

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
      makeDialog: (view, options) => makeDialog(view, options, ctx, $$dialogs),
    };
  }
}

function makeDialog(viewFn, options, ctx, $$dialogs) {
  const markup = new Markup((config) => new View({ ...config, setup: viewFn }));

  const $$open = makeState(true);
  let openSubscription;
  let view;

  function open(attributes = {}) {
    $$open.set(true);

    view = markup.build({
      appContext: ctx[APP_CONTEXT],
      attributes: {
        ...attributes,
        $$open,
      },
    });

    $$dialogs.update((current) => {
      current.push(view);
    });

    openSubscription = $$open.subscribe((value) => {
      if (!value) {
        close();
      }
    });
  }

  function close() {
    if (view) {
      $$dialogs.update((current) => {
        current.splice(
          current.findIndex((v) => v === view),
          1
        );
      });
      view = null;
    }

    if (openSubscription) {
      openSubscription.unsubscribe();
      openSubscription = null;
    }
  }

  return {
    open,
    close,
  };
}
