export type StoreConfig<I, E> = {
  /**
   * A name to identify this store in the console and dev tools.
   */
  label?: string;

  /**
   * An explanation of this store.
   */
  about?: string;

  /**
   * Values passed into this store, usually as HTML attributes.
   */
  inputs?: InputsConfig<I>;

  /**
   * Configures the store and returns object to export.
   */
  setup: StoreSetupFn<I, E>;
};

type StoreSetupFn<I, E> = (ctx: StoreContext<I>) => E;

type StoreContext<I> = {
  inputs: Inputs<I>;
};

interface Inputs<T> {
  get<K extends keyof T>(key: K): T[K];
  get(): T;
}

type InputsConfig<T = any> = {
  [name in keyof T]: {
    /**
     * Validates input value at runtime. The app will crash if `validate` returns false or throws an Error.
     */
    parse?: (value: unknown) => T[name];

    /**
     * Attribute description for viewer.
     */
    about?: string;

    /**
     * The default value if the input is not passed.
     */
    default?: T[name];

    /**
     * Allows writing back to writable bindings to propagate changes up to a parent view. Also known as two-way binding.
     * All bindings are only readable by default.
     */
    writable?: boolean;

    /**
     * Allows a value to be omitted without defining a default value.
     */
    optional?: boolean;
  };
};

class Store<Inputs, Exports> {}

function makeStore<
  T extends StoreConfig<any, any>,
  I = Record<keyof T["inputs"], any>,
  E = ReturnType<T["setup"]>
>(config: StoreConfig<I, E>) {
  return new Store<I, E>();
}

const TestStore = makeStore({
  inputs: {
    initialValue: {
      // TODO: Inputs with default values are optional in Store input type.
      // TODO: Implement parse function and extract input type from it.
      default: "default",
    },
    other: {
      parse: (value) => Number(value),
    },
  },

  setup(ctx) {
    return {
      value: ctx.inputs.get("initialValue"),
      speak: () => {
        console.log("the value is", ctx.inputs.get("initialValue"));
      },
    };
  },
});
