import { isString, isNumber, isFunction, isNode, isDolla } from "../../_helpers/typeChecking";
import { isState } from "@woofjs/state";
import { $Text } from "./$Text";

/**
 * Takes any element valid as a child and returns a render function that produces a $Node.
 */
export function makeRender(element) {
  if (element.isComponentInstance) {
    console.log(element);

    return () => {
      return {
        get $isConnected() {
          return element.element.parentNode != null;
        },
        get $isNode() {
          return true;
        },
        $connect(parent, after) {
          console.log({ parent, after });

          element._beforeConnect();
          element._connected();
          element._beforeDisconnect();
          element._disconnected();
        },
        $disconnect() {},
      };

      // const $classes = makeState({
      //   active: false,
      // });

      // $classes.set((current) => (current.active = !current.active));

      // <div class={$classes}></div>
    };
  } else if (isNode(element)) {
    return () => element;
  } else if (isDolla(element)) {
    return () => element();
  } else if (isString(element) || isNumber(element)) {
    return () => new $Text(element);
  } else if (isState(element)) {
    return makeRender(element.get());
  } else if (isFunction(element)) {
    return makeRender(element());
  } else {
    throw new Error(`Expected a string, function or element. Received: ${element}`);
  }
}
