import { TransformFunc } from "../../types";

/**
 * Forwards the result of the `transform` function for each message.
 *
 * @param transform - function to transform message
 */
export function map<I, O>(transform: (value: I) => O): TransformFunc<I, O> {
  return (message, send) => {
    send(transform(message));
  };
}
