import { Source } from "../../Source";

/**
 * Generic Source for testing.
 */
export class TestSource<T> extends Source<T> {
  send(value: T) {
    this.value = value;
    this.broadcast();
  }
}
