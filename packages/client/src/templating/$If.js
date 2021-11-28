import { isFunction, isString } from "../_helpers/typeChecking";
import { state } from "../data/state";
import { $Node } from "./$Node";
import { $Text } from "./$Text";

export class $If extends $Node {
  condition;
  then;
  otherwise;
  mounted;
  mountedIs = null;
  unlisten;

  constructor(value, then, otherwise = null) {
    super();
    this.condition = isFunction(value) ? value : state(value);
    this.then = this.#wrap(then);
    this.otherwise = otherwise && this.#wrap(otherwise);
  }

  // TODO: Consolidate this wrapping into a utility function.
  //       This is standard logic needed anywhere rendering happens.
  #wrap(result) {
    if (result.isDolla) {
      return () => result;
    } else if (isString(result)) {
      return () => new $Text(result);
    } else if (isFunction(result)) {
      return () => {
        const value = result();

        if (value && value.isDolla) {
          return value();
        }

        return value;
      };
    } else {
      throw new Error(
        `Expected a string, function or $(element). Received: ${result}`
      );
    }
  }

  update(value) {
    requestAnimationFrame(() => {
      if (this.element?.parentNode) {
        if (value) {
          if (this.mountedIs !== "then") {
            if (this.mounted) this.mounted.disconnect();
            this.mounted = this.then();
            this.mounted.connect(this.element.parentNode, this.element);
            this.mountedIs = "then";
          }
        } else {
          if (this.otherwise) {
            if (this.mountedIs !== "otherwise") {
              if (this.mounted) this.mounted.disconnect();
              this.mounted = this.otherwise();
              this.mounted.connect(this.element.parentNode, this.element);
              this.mountedIs = "otherwise";
            }
          }
        }
      } else {
        if (this.mounted) {
          this.mounted.disconnect();
          this.mountedIs = null;
        }
      }
    });
  }

  beforeConnect() {
    if (!this.unlisten) {
      this.unlisten = this.condition(this.update.bind(this));
    }
  }

  connected() {
    this.update(this.condition());
  }

  disconnected() {
    if (this.mounted) {
      this.mounted.disconnect();
    }

    if (this.unlisten) {
      this.unlisten();
      this.unlisten = undefined;
    }
  }
}
