export function makeNode(fn) {
  return function (...args) {
    const onBeforeConnect = [];
    const onConnected = [];
    const onBeforeDisconnect = [];
    const onDisconnected = [];

    const self = {
      get element() {
        return element;
      },
      get isConnected() {
        return element && element.parentNode != null;
      },
      beforeConnect: (callback) => onBeforeConnect.push(callback),
      connected: (callback) => onConnected.push(callback),
      beforeDisconnect: (callback) => onBeforeDisconnect.push(callback),
      disconnected: (callback) => onDisconnected.push(callback),
    };

    const element = fn(self, ...args);

    return {
      isNode: true,

      get element() {
        return element;
      },

      get isConnected() {
        return element && element.parentNode != null;
      },

      connect(parent, after = null) {
        const wasConnected = this.isConnected;

        // Run lifecycle callback only if connecting.
        // Connecting a node that is already connected moves it without unmounting.
        if (!wasConnected) {
          for (const callback of onBeforeConnect) {
            callback();
          }
        }

        parent.insertBefore(element, after ? after.nextSibling : null);

        if (!wasConnected) {
          for (const callback of onConnected) {
            callback();
          }
        }
      },

      disconnect() {
        if (this.isConnected) {
          for (const callback of onBeforeDisconnect) {
            callback();
          }

          element.parentNode.removeChild(element);

          for (const callback of onDisconnected) {
            callback();
          }
        }
      },
    };
  };
}
