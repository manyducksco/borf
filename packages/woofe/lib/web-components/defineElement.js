import { appContext, elementContext } from "./globals.js";

/**
 * Defines a woofe component as a custom element.
 */
export function defineElement(tag, component) {
  if (!tag.includes("-")) {
    throw new Error(`Custom element names are required to have a dash ('-') character in them. Got: ${tag}`);
  }

  if (!window.customElements) {
    throw new Error(`This browser does not support custom elements.`);
  }

  customElements.define(
    tag,
    class extends WoofeElement {
      component = component;

      static get observedAttributes() {
        if (component.attrs) {
          return Object.keys(component.attrs); // Subscribe to changes on all defined attributes.
        } else {
          return [];
        }
      }
    }
  );
}

class WoofeElement extends HTMLElement {
  component;
  instance;

  connectedCallback() {
    // Unpack the NamedNodeMap into a usable object.
    const initialAttributes = Object.values(this.attributes).reduce((obj, attr) => {
      obj[attr.localName] = attr.value;
      return obj;
    }, {});

    this.instance = new this.component({
      appContext,
      elementContext,
      attributes: initialAttributes, // TODO: Update attributes when `attributeChangedCallback` runs.
      attributeDefs: this.component.attrs,
      channelPrefix: "element",
      label: this.component.label || this.localName,
    });

    const shadow = this.attachShadow({ mode: "open" });

    this.instance.connect(shadow);
  }

  disconnectedCallback() {
    this.instance.disconnect();
  }

  // attributeChangedCallback(name, oldValue, newValue) {
  //   console.log(`Attribute '${name}' changed from ${oldValue} to ${newValue}`);
  // }
}
