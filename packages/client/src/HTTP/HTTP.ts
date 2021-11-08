import { Pipe } from "../Pipe/Pipe";
import { Source } from "../Source";
import { isFunction, isObject } from "../utils";

export type RequestContext<T> = {
  url: string;
  status?: number;
  headers: {
    [name: string]: string;
  };
  body?: T;
};

export type RequestOptions = {
  headers?: {
    [name: string]: string;
  };
  body?: any;
};

export type NextFunction = () => Promise<any>;

export type RequestMiddleware<T = any> = (
  context: RequestContext<T>,
  next: NextFunction
) => void;

class HTTPClient {
  middleware: RequestMiddleware[] = [];

  createInstance() {
    return new HTTPClient();
  }

  use(...middleware: RequestMiddleware[]) {
    this.middleware.push(...middleware);
  }

  get<T>(url: string, ...args: any[]): RequestSource<T> {
    const { middleware, options } = this.parseArgs(args);

    return new RequestSource<T>(url, "get", options, [
      ...middleware,
      ...this.middleware,
    ]);
  }

  put<T>(url: string, ...args: any[]): RequestSource<T> {
    const { middleware, options } = this.parseArgs(args);

    return new RequestSource<T>(url, "put", options, [
      ...middleware,
      ...this.middleware,
    ]);
  }

  patch<T>(url: string, ...args: any[]): RequestSource<T> {
    const { middleware, options } = this.parseArgs(args);

    return new RequestSource<T>(url, "patch", options, [
      ...middleware,
      ...this.middleware,
    ]);
  }

  post<T>(url: string, ...args: any[]): RequestSource<T> {
    const { middleware, options } = this.parseArgs(args);

    return new RequestSource<T>(url, "post", options, [
      ...middleware,
      ...this.middleware,
    ]);
  }

  delete<T>(url: string, ...args: any[]): RequestSource<T> {
    const { middleware, options } = this.parseArgs(args);

    return new RequestSource<T>(url, "post", options, [
      ...middleware,
      ...this.middleware,
    ]);
  }

  private parseArgs(args: any[]) {
    const lastArg = args[args.length - 1];

    for (const arg of args) {
      if (arg !== lastArg) {
        if (!isFunction(arg)) {
          throw new TypeError(
            `Expecting middleware function but got ${typeof arg}`
          );
        }
      }
    }

    let middleware: RequestMiddleware[] = [];
    let options: RequestOptions = {};

    if (isObject(lastArg)) {
      options = args.pop();
    }

    middleware = args;

    return { middleware, options };
  }
}

export const HTTP = new HTTPClient();

class StatusSource extends Source<boolean> {
  constructor(pipe: Pipe<boolean, any>) {
    super(false);

    pipe.receive((value) => {
      this.value = value;
      this.broadcast();
    });
  }
}

class RequestSource<T> extends Source<RequestContext<T>> {
  // implements Promise<RequestContext<T>>
  private _isLoadingPipe = new Pipe<boolean>();
  private _isSuccessPipe = new Pipe<boolean>();
  private _isErrorPipe = new Pipe<boolean>();
  private _promise?: Promise<RequestContext<T>>;

  isLoading = new StatusSource(this._isLoadingPipe);
  isSuccess = new StatusSource(this._isSuccessPipe);
  isError = new StatusSource(this._isErrorPipe);

  constructor(
    private url: string,
    private method: string,
    private options: RequestOptions,
    private middleware: RequestMiddleware[]
  ) {
    super({
      url,
      status: undefined,
      headers: {},
      body: undefined,
    });

    this._isSuccessPipe.send(false);
    this._isErrorPipe.send(false);
    this._isLoadingPipe.send(false);

    this.reload();
  }

  async reload() {
    this._isLoadingPipe.send(true);

    const ctx: RequestContext<T> = {
      url: this.url,
      status: undefined,
      headers: {},
      body: undefined,
    };

    const handler = async () => {
      const res = await fetch(this.url, {
        method: this.method,
        headers: ctx.headers,
        body: ctx.body as unknown as any,
      });

      ctx.status = res.status;
      res.headers.forEach((value, key) => {
        ctx.headers[key] = value;
      });

      if (ctx.headers["content-type"] === "application/json") {
        ctx.body = await res.json();
      } else {
        ctx.body = (await res.text()) as unknown as T;
      }
    };

    const wrapMiddleware = (index: number): NextFunction => {
      const current = this.middleware[index];
      const next = this.middleware[index + 1]
        ? wrapMiddleware(index + 1)
        : handler;

      return async () => current(ctx, next);
    };

    if (this.middleware.length > 0) {
      await wrapMiddleware(0)();
    } else {
      await handler();
    }

    this.value = ctx;
    this.broadcast();
    this._isLoadingPipe.send(false);

    if (ctx.status && ctx.status >= 200 && ctx.status < 400) {
      this._isSuccessPipe.send(true);
      this._isErrorPipe.send(false);
    } else {
      this._isSuccessPipe.send(false);
      this._isErrorPipe.send(true);
    }
  }
}
