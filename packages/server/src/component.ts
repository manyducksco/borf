export type Store<A, E> = (attributes: A) => E | Promise<E>;

/**
 * Parameters passed to the makeStore function.
 */
interface StoreConfig<A> {
  store: Store<A, any>;
  attributes: A;
}

/**
 * Methods for the framework to manipulate a store.
 */
export interface StoreControls {
  exports?: object;
  connect(): Promise<void>;
}

export function makeStore<A>(config: StoreConfig<A>): StoreControls {
  let output: object | undefined;

  const controls: StoreControls = {
    get exports() {
      return output;
    },

    async connect() {
      output = config.store(config.attributes);

      if (output instanceof Promise) {
        output = await output;
      }
    },
  };

  return controls;
}
