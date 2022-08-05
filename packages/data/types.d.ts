declare module "@woofjs/data" {
  type ModelOptions<Schema> = {
    /**
     * A string with the name of the schema property that uniquely identifies a record.
     * Generally this would be an ID from a database, a UUID, or another unique value.
     */
    key: string;

    /**
     * A function to define the shape of the data held by this model.
     * Takes an object `v` with chainable methods to define your data types.
     */
    schema: (v: Validators) => ObjectValidator<Schema>;
  };

  /**
   * Defines a new model.
   */
  export function makeModel(options: ModelOptions<any>): Model<any>;

  interface Model<Schema> {
    new (data: Schema): Record<Schema>;

    /**
     * Validates an object against this model's schema.
     */
    validate(data: unknown): ValidationResult;

    /**
     * The key property. This is the same value that was passed as `key` when the model was defined.
     */
    key: string;
  }

  interface Record<Schema> {
    [Property: keyof Schema]: S[Property];

    /**
     * Subscribe to changes on this record.
     *
     * @param callback - A function that receives a copy of the current data whenever changes occur.
     */
    subscribe(callback: (value: Schema) => void): Subscription;

    /**
     * Subscribe to changes on this record.
     *
     * @param observer - An observer object with a `next` function that receives a copy of the current data whenever changes occur.
     */
    subscribe(observer: Observer<Schema>): Subscription;

    /**
     * Get the data from this record as a plain object.
     */
    toObject(): Schema;
  }

  interface Observer<T> {
    next: (value: T) => void;
  }

  interface Subscription {
    unsubscribe: () => void;
  }

  /*==============================*\
  ||          Validation          ||
  \*==============================*/

  interface ValidationError {
    path: string[];
    message: string;
    received: unknown;
  }

  interface ValidationResult {
    key: any;
    valid: boolean;
    errors: ValidationError[];
  }

  type RefineFunc = (value: unknown) => string | undefined;

  type Validators = {
    boolean(): BooleanValidator;
    func(): FunctionValidator;
    number(): NumberValidator;
    object(): ObjectValidator;
    string(): StringValidator;
    symbol(): SymbolValidator;

    arrayOf(...validators: Validator | any): ArrayOfValidator;
    custom(fn: RefineFunc): Validator;
    instanceOf<Type>(object: Type): InstanceOfValidator<Type>;
    oneOf(...validators: Validator | any): OneOfValidator;
  };

  interface Validator {
    /**
     * Refine this validator with a custom validation function.
     *
     * @param fn - Receives the value and returns an error message string if there are any issues.
     */
    refine(fn: RefineFunc): this;
  }

  interface BooleanValidator extends Validator {}

  interface FunctionValidator extends Validator {}

  interface NumberValidator extends Validator {}

  interface ObjectValidator extends Validator {
    /**
     * Consider all properties invalid besides those explicitly defined in this schema.
     */
    strict(): this;
  }

  interface StringValidator extends Validator {
    pattern(regexp: RegExp): this;

    /**
     * Requires this string to parse as a valid JS date with `Date.parse` or `new Date()`;
     */
    date(): this;

    /**
     * Requires this string to be a valid ISO 8601 date string.
     */
    isoDate(): this;
  }

  interface SymbolValidator extends Validator {}

  interface ArrayOfValidator extends Validator {}

  interface InstanceOfValidator<Type> extends Validator {}

  interface OneOfValidator extends Validator {}

  /*==============================*\
  ||         Collections          ||
  \*==============================*/

  /**
   * Create a collection of records that all conform to one model.
   */
  export function collectionOf<Schema>(
    model: Model<Schema>
  ): Collection<Schema>;

  type CancelFunc = () => void;

  interface Collection<Schema> {
    /**
     * Register a callback to fire when the collection emits a specified event.
     * Receives an array of affected records.
     *
     * @param event - The event to listen for.
     * @param callback - The function to call when the event is emitted.
     *
     * @returns a cancel function to unregister the event listener.
     */
    on(
      event: "add" | "update" | "delete",
      callback: (records: Schema[]) => void
    ): CancelFunc;

    get(key: any): Promise<Schema | undefined>;
    set(...data: Schema[]): Promise<void>;
    clear(): Promise<void>;

    find(selector: any): PromiseObservable<Schema>;
    filter(fn: (record: Schema) => boolean): PromiseObservable<Schema>;
  }

  /**
   * A single object that can be treated as a promise (`.then()` or `await`)
   * to get the first value emitted, or `.subscribe()` to continue receiving
   * values until unsubscribed.
   */
  interface PromiseObservable<Type> extends Promise {
    /**
     * Subscribe to receive values until unsubscribed.
     *
     * @param callback - A function that receives new values.
     */
    subscribe(callback: (value: Type) => void): Subscription;

    /**
     * Subscribe to receive values until unsubscribed.
     *
     * @param observer - An observer object with a `next` function that receives new values.
     */
    subscribe(observer: Observer<Type>): Subscription;
  }
}
