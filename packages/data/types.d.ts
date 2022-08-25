declare module "@woofjs/data" {
  type ModelOptions<Schema extends ObjectValidator<any>> = {
    /**
     * A string with the name of the schema property that uniquely identifies a record.
     * Generally this would be an ID from a database, a UUID, or another unique value.
     */
    key: string;

    /**
     * A function to define the shape of the data held by this model.
     * Takes an object `v` with chainable methods to define your data types.
     */
    schema: Schema | ((v: Validators) => Schema);
  };

  /**
   * Defines a new model.
   */
  export function makeModel<Schema>(
    options: ModelOptions<Schema>
  ): Model<Schema>;

  /**
   * Standalone schema validators.
   */
  export const v: Validators;

  interface Model<Schema extends ObjectValidator<any>> {
    /**
     * Validates an object against this model's schema.
     */
    validate(data: unknown): ModelValidationResult;

    /**
     * The key property. This is the same value that was passed as `key` when the model was defined.
     */
    key: string;

    /**
     * The shape this model's data must conform to.
     */
    schema: Schema;
  }

  interface Record<Schema> {
    /**
     * Subscribe to changes on this record.
     *
     * @param callback - A function that receives a copy of the current data whenever changes occur.
     */
    subscribe(callback: (value: ShapeOf<Schema>) => void): Subscription;

    /**
     * Subscribe to changes on this record.
     *
     * @param observer - An observer object with a `next` function that receives a copy of the current data whenever changes occur.
     */
    subscribe(observer: Observer<ShapeOf<Schema>>): Subscription;

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
  ||        Type Inference        ||
  \*==============================*/

  /**
   * Extracts a TypeScript type from a model's schema.
   */
  export type ShapeOf<T extends Model<any>> = TypeFrom<T["schema"]>;

  /**
   * Extracts a TypeScript type from a validator.
   */
  export type TypeFrom<T extends Validator<any>> = T extends Validator<infer U>
    ? U
    : unknown;

  /*==============================*\
  ||         Collections          ||
  \*==============================*/

  /**
   * Create a collection of records that all conform to one model.
   */
  export function collectionOf<Schema>(
    model: Model<Schema>,
    options?: CollectionOptions
  ): Collection<TypeFrom<Schema>>;

  interface CollectionOptions {
    sortBy: string | { key: string; descending?: boolean };
  }

  type CancelFunc = () => void;

  interface Collection<Shape> {
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
      callback: (records: Shape[]) => void
    ): CancelFunc;

    get(key: any): Promise<Shape | undefined>;
    set(...data: Shape[]): Promise<void>;
    clear(): Promise<void>;

    find(selector: any): PromiseObservable<Shape>;
    filter(fn: (record: Shape) => boolean): PromiseObservable<Shape[]>;
  }

  /**
   * A single object that can be treated as a promise (`.then()` or `await`)
   * to get the first value emitted, or `.subscribe()` to continue receiving
   * values until unsubscribed.
   */
  interface PromiseObservable<Type> extends Promise<Type> {
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

  /*==============================*\
  ||          Validation          ||
  \*==============================*/

  interface ValidationError {
    path: string[];
    message: string;
    received: unknown;
  }

  interface ModelValidationResult extends ValidationResult {
    key: any;
    valid: boolean;
    errors: ValidationError[];
  }

  interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
  }

  type RefineFunc = (value: unknown) => string | undefined;

  type ObjectSchema = {
    [key: string]: Validator;
  };

  type Validators = {
    boolean(): BooleanValidator;
    func(): FunctionValidator;
    number(): NumberValidator;
    object<Schema extends ObjectSchema>(
      schema: Schema
    ): ObjectValidator<Schema>;
    string(): StringValidator;
    symbol(): SymbolValidator;

    arrayOf(...validators: Validator | any): ArrayOfValidator;
    custom<T extends RefineFunc>(fn: T): Validator;
    instanceOf<Type>(object: Type): InstanceOfValidator<Type>;

    oneOf<V extends OneOfValues, T extends V[]>(
      ...values: T
    ): OneOfValidator<T>;
  };

  type OneOfValues = string | number | Validator;

  type UnionOf<T extends any[]> = T[number];

  export function tuplify<V extends OneOfValues, T extends V[]>(...ary: T): T;

  interface Validator<T = any> {
    _type: T;

    /**
     * Refine this validator with a custom validation function.
     *
     * @param fn - Receives the value and returns an error message string if there are any issues.
     */
    refine(fn: RefineFunc): this;

    /**
     * Validate `value` against this schema.
     */
    validate(value: unknown): ValidationResult;

    /**
     * Validate `value` against this schema and throw a TypeError if validation fails.
     */
    assert(value: unknown): void;
  }

  interface BooleanValidator extends Validator<boolean> {}

  interface FunctionValidator extends Validator<(...args: any) => any> {}

  interface NumberValidator extends Validator<number> {
    /**
     * Require the number to be no less than `value`.
     *
     * @param value - Minimum value.
     */
    min(value: number): this;

    /**
     * Require the number to be no greater than `value`.
     *
     * @param value - Maximum value.
     */
    max(value: number): this;
  }

  interface ObjectValidator<Schema> extends Validator {
    _type: {
      [Key in keyof Schema]: Schema[Key] extends Validator
        ? Schema[Key]["_type"]
        : Schema[Key];
    };

    /**
     * Consider all properties invalid besides those explicitly defined in this schema.
     */
    strict(): this;
  }

  interface StringValidator extends Validator<string> {
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

  interface InstanceOfValidator<Type> extends Validator<Type> {}

  interface OneOfValidator<Type> extends Validator<Type> {}
}
