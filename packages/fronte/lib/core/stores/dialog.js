import { Type } from "@frameworke/bedrocke";
import { APP_CONTEXT } from "../keys.js";
import { State } from "../classes/State.js";
import { Store } from "../classes/Store.js";
import { Markup } from "../classes/Markup.js";
import { View } from "../classes/View.js";

/**
 * Manages dialogs. Also known as modals.
 * TODO: Describe this better.
 */
export const DialogStore = Store.define({
  setup(ctx) {
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.right = "0";
    container.style.bottom = "0";
    container.style.left = "0";
    container.style.zIndex = "99999";

    /**
     * A first-in-last-out queue of dialogs. The last one appears on top.
     * This way if a dialog opens another dialog the new dialog stacks.
     */
    const $$dialogs = new State([]);

    let activeDialogs = [];

    // Diff dialogs when value is updated, adding and removing dialogs as necessary.
    ctx.observe($$dialogs, (dialogs) => {
      requestAnimationFrame(() => {
        let removed = [];
        let added = [];

        for (const dialog of activeDialogs) {
          if (!dialogs.includes(dialog)) {
            removed.push(dialog);
          }
        }

        for (const dialog of dialogs) {
          if (!activeDialogs.includes(dialog)) {
            added.push(dialog);
          }
        }

        for (const dialog of removed) {
          dialog.disconnect();
          activeDialogs.splice(activeDialogs.indexOf(dialog), 1);
        }

        for (const dialog of added) {
          dialog.connect(container);
          activeDialogs.push(dialog);
        }

        // Container is only connected to the DOM when there is at least one dialog to display.
        if (activeDialogs.length > 0) {
          if (!container.parentNode) {
            document.body.appendChild(container);
          }
        } else {
          if (container.parentNode) {
            document.body.removeChild(container);
          }
        }
      });
    });

    return {
      open: (view, inputs = {}) => {
        let markup;

        if (Type.isFunction(view)) {
          markup = new Markup((config) => new View({ ...config, setup: view }));
        } else if (View.isView(view)) {
          markup = new Markup((config) => new view(config));
        }

        if (!markup) {
          throw new TypeError(`Expected a view or setup function. Got: ${view}`);
        }

        const $$open = new State(true);

        let instance = markup.init({
          appContext: ctx[APP_CONTEXT],
          inputs: { ...inputs, open: $$open },
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
      },
    };
  },
});
