import { Pipe, PipeReceiverCallback } from "../Pipe/Pipe";
import { State, StateOptions } from "./State";

type FormStateValidator = (value: unknown) => string | void;

type FormStateError<T> = { key: keyof T; message: string };

interface FormStateOptions<T> extends StateOptions {
  fields: T;

  names?: {
    [key in keyof T]: string;
  };

  validate?: {
    [key in keyof Partial<T>]: FormStateValidator;
  };
}

/**
 * State with validation for building forms.
 */
export class FormState<T> extends State<T> {
  private options: FormStateOptions<T>;
  private errorsPipe = new Pipe<FormStateError<T>[]>();

  errors = new FormStateErrors<T>(this.errorsPipe);

  get isValid() {
    return this.errors.current.length === 0;
  }

  constructor(options: FormStateOptions<T>) {
    super(options.fields, options);
    this.options = Object.freeze(options);

    // do initial validation
    this.validate(Object.keys(options.fields) as Array<keyof T>);
  }

  protected notifySubscribers(keys: Array<keyof T>) {
    this.validate(keys);
    super.notifySubscribers(keys);
  }

  private validate(keys: Array<keyof T>) {
    const errors = this.errors.current.filter((err) => !keys.includes(err.key));

    for (const key of keys) {
      const validator = this.options.validate?.[key];

      if (validator) {
        const message = validator(this.current[key]);

        if (message) {
          errors.push(
            Object.freeze({
              key,
              message: this.options.names?.[key]
                ? this.options.names?.[key] + " " + message
                : message,
            })
          );
        }
      }
    }

    this.errorsPipe.send(errors);
  }
}

class FormStateErrors<T> {
  private pipe: Pipe<FormStateError<T>[]>;
  current: Readonly<FormStateError<T>[]> = [];

  constructor(pipe: Pipe<FormStateError<T>[]>) {
    pipe.receive((errors) => {
      this.current = Object.freeze(errors);
    });

    this.pipe = pipe;
  }

  subscribe() {}
}
