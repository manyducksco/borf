import { makeView, type View } from "../view.js";
import { getStoreSecrets, type StoreContext } from "../store.js";
import { type DOMHandle } from "../markup.js";
import { Writable } from "../state.js";

interface DialogAttrs {
  $$open: Writable<boolean>;
}

/**
 * Manages dialogs. Also known as modals.
 * TODO: Describe this better.
 */
export function DialogStore(c: StoreContext) {
  c.name = "borf/dialog";

  const { appContext, elementContext } = getStoreSecrets(c);

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
  const $$dialogs = new Writable<DOMHandle[]>([]);

  let activeDialogs: DOMHandle[] = [];

  // Diff dialogs when value is updated, adding and removing dialogs as necessary.
  c.observe($$dialogs, (dialogs) => {
    requestAnimationFrame(() => {
      let removed: DOMHandle[] = [];
      let added: DOMHandle[] = [];

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

  c.onDisconnected(() => {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  });

  function open<I extends DialogAttrs>(view: View<I>, inputs?: Omit<I, "$$open">) {
    const $$open = new Writable(true);

    let instance: DOMHandle | undefined = makeView({
      view: view as View<unknown>,
      appContext,
      elementContext,
      attributes: { ...inputs, $$open },
    });
    $$dialogs.update((current) => {
      current.push(instance!);
    });

    const stopObserver = $$open.observe((value) => {
      if (!value) {
        closeDialog();
      }
    });

    function closeDialog() {
      $$dialogs.update((current) => {
        current.splice(
          current.findIndex((x) => x === instance),
          1
        );
      });
      instance = undefined;

      stopObserver();
    }

    return closeDialog;
  }

  return {
    open,
  };
}
