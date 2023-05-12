export {
  Readable,
  Writable,
  Spring,
  Ref,
  Outlet,
  html,
  when,
  unless,
  repeat,
  observe,
  useBeforeConnect,
  useBeforeDisconnect,
  useConnected,
  useConsole,
  useCrash,
  useDisconnected,
  useLoader,
  useMerge,
  useName,
  useObserver,
  useReadable,
  useStore, // needs a different implementation, or at least types that don't support App's built-in stores.
  useValue,
  useWritable,
} from "@borf/browser";

import {
  type AppContext,
  type ElementContext,
} from "@borf/browser/lib/core/classes/App.js";
import { CrashCollector } from "@borf/browser/lib/core/classes/CrashCollector";
import { DebugHub } from "@borf/browser/lib/core/classes/DebugHub";
import {
  type ComponentControls,
  makeComponent,
} from "@borf/browser/lib/core/component.js";

export function defineElement(tag: string, component: unknown) {
  customElements.define(
    tag,
    class extends Elemental {
      component = component;
      label = tag;
    }
  );
}

class Elemental extends HTMLElement {
  component: unknown;
  instance!: ComponentControls;
  label: string = "";
  appContext!: AppContext;
  elementContext!: ElementContext;

  connectedCallback() {
    const mode = "production";
    const crashCollector = new CrashCollector();
    const debugHub = new DebugHub({
      crashCollector,
      mode,
    });

    this.appContext = {
      crashCollector,
      debugHub,
      stores: new Map(),
      mode,
    };
    this.elementContext = this.getElementContext();

    this.attachShadow({ mode: "open" });

    this.instance = makeComponent({
      appContext: this.appContext,
      elementContext: this.elementContext,
      component: this.component as any,
      inputs: {},
    });

    this.instance.connect(this.shadowRoot!);
  }

  disconnectedCallback() {
    this.instance.disconnect();
  }

  getElementContext(): ElementContext {
    while (this.parentNode && this.parentNode !== document.body) {
      if (this.parentNode instanceof Elemental) {
        return this.parentNode.elementContext;
      }
    }

    return {
      stores: new Map(),
    };
  }
}
