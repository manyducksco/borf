// Simulated DOM API which really makes a VDOM
// This VDOM is rendered by various render functions for different environments
// const element = makeElement("div");
// const text = makeElement(":text:");
// const fragment = makeElement(":fragment:");

// element.classList;
// element.dataset;
// element.textContent;
// element.value;
// element.isConnected;
// element.parentNode;
// element.nextSibling;

// element.insertBefore(parentElement, beforeElement);
// element.setAttribute("name", "value");
// element.removeAttribute("name");
// element.addClass("name");
// element.removeClass("name");
// element.setData("name", "value");
// element.removeData("name");

// element.appendChild(otherElement);

// renderToString(element);
// renderToDOM(element);

export class $Node {
  element;
  #watchers = [];

  get isNode() {
    return true;
  }

  get isConnected() {
    return this.element?.parentNode != null;
  }

  createElement() {
    return document.createTextNode("");
  }

  watchState(state, ...args) {
    this.#watchers.push(state.watch(...args));
  }

  connect(parent, after = null) {
    const wasConnected = this.isConnected;

    // Run lifecycle callback only if connecting.
    // Connecting a node that is already connected moves it without unmounting.
    if (!wasConnected) {
      this.element = this.createElement();
      this.beforeConnect();
    }

    parent.insertBefore(this.element, after ? after.nextSibling : null);

    if (!wasConnected) {
      this.connected();
    }
  }

  disconnect() {
    if (this.isConnected) {
      this.beforeDisconnect();

      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }

      this.disconnected();
      this.element = null;
    }

    for (const unwatch of this.#watchers) {
      unwatch();
    }
    this.#watchers = [];
  }

  beforeConnect() {}
  connected() {}
  beforeDisconnect() {}
  disconnected() {}
}
