import { makeGlobal } from "@woofjs/client";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "../../keys.js";
import { ViewBlueprint } from "../../view/blueprints/View.js";

/**
 * Manages dialogs. Also known as modals.
 * TODO: Describe this better.
 */
export default makeGlobal((ctx) => {
  /**
   * A first-in-last-out queue of dialogs. The last one appears on top.
   * This way if a dialog opens another dialog the new dialog stacks.
   */
  const $$dialogs = ctx.state([]);

  // Add $dialogs to app context so the app can display them.
  ctx[APP_CONTEXT].$dialogs = $$dialogs.readable();

  return {
    make: (view, options) => makeDialog(view, options, ctx),
  };
});

function makeDialog(viewFn, options, ctx) {
  const view = new ViewBlueprint(viewFn).build({
    appContext: ctx[APP_CONTEXT],
    elementContext: ctx[ELEMENT_CONTEXT],
  });

  const $$open = ctx.state(true);
  let openSubscription;

  function open(attributes = {}) {
    view.state.set({ ...attributes, open: true });

    ctx.update("dialogs", (current) => {
      if (!current.includes(view)) {
        current.push(view);
      }
    });

    openSubscription = $$open.subscribe((value) => {
      if (!value) {
        close();
      }
    });
  }

  function close() {
    ctx.update("dialogs", (current) => {
      current.splice(
        current.findIndex((v) => v === view),
        1
      );
    });

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
