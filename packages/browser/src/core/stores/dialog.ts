import { Type } from "@borf/bedrock";
import { APP_CONTEXT, ELEMENT_CONTEXT } from "../keys.js";
import { Writable } from "../classes/Writable.js";
import { Store } from "../classes/Store.js";
import { Markup, type MarkupConfig } from "../classes/Markup.js";
import { View, Viewable, ViewSetupFunction } from "../classes/View.js";
import { type Connectable } from "../classes/Connectable.js";
import { InputValues } from "core/classes/Inputs.js";

interface DialogInputs {
  open: boolean;
}

interface DialogConfig extends MarkupConfig {
  inputs: {
    open: Writable<boolean>;
  };
}

/**
 * Manages dialogs. Also known as modals.
 * TODO: Describe this better.
 */
export const DialogStore = new Store({
  label: "dialog",

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
    const $$dialogs = new Writable<Connectable[]>([]);

    let activeDialogs: Connectable[] = [];

    // Diff dialogs when value is updated, adding and removing dialogs as necessary.
    ctx.observe($$dialogs, (dialogs) => {
      requestAnimationFrame(() => {
        let removed: Connectable[] = [];
        let added: Connectable[] = [];

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

    ctx.onDisconnect(() => {
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    });

    return {
      open: <I extends DialogInputs>(view: Viewable<I>, inputs?: InputValues<Omit<I, "open">>) => {
        let markup: Markup<DialogConfig> | undefined;

        if (Type.isFunction(view)) {
          markup = new Markup((config) => new View({ setup: view as ViewSetupFunction<any> }).create(config));
        } else if (View.isView(view)) {
          markup = new Markup((config) => view.create(config));
        }

        if (!markup) {
          throw new TypeError(`Expected a view or setup function. Got: ${view}`);
        }

        const $$open = new Writable(true);

        let instance: Connectable | undefined = markup.init({
          appContext: ctx[APP_CONTEXT],
          elementContext: ctx[ELEMENT_CONTEXT],
          inputs: { ...inputs, open: $$open },
        });
        $$dialogs.update((current) => {
          current.push(instance!);
        });

        const stop = $$open.observe((value) => {
          if (!value) {
            close();
          }
        });

        return function close() {
          $$dialogs.update((current) => {
            current.splice(
              current.findIndex((x) => x === instance),
              1
            );
          });
          instance = undefined;

          stop();
        };
      },
    };
  },
});
