import type { ServerResponse } from "http";

import EventEmitter from "events";

type EventSourceCallback = (ctx: EventSourceContext) => void;

export class EventSource {
  #callback: EventSourceCallback;

  constructor(callback: EventSourceCallback) {
    this.#callback = callback;
  }

  /**
   * Prepare the response and run `fn` to start generating events.
   *
   * @param res - An instance of http.ServerResponse.
   */
  start(res: ServerResponse) {
    res.writeHead(200, {
      "Cache-Control": "no-cache",
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
    });
    res.flushHeaders();

    const ctx = new EventSourceContext(res);

    // Tell the client to retry every 10 seconds (by default) if connectivity is lost.
    // res.write(`retry: ${10000}\n\n`);

    res.on("close", () => {
      res.end();
      ctx.emit("close");
    });

    this.#callback(ctx);
  }
}

class EventSourceContext extends EventEmitter {
  #res: ServerResponse;

  constructor(res: ServerResponse) {
    super();
    this.#res = res;
  }

  send<T>(data: T) {
    this.#res.write(`data: ${data}\n\n`);
  }

  emit(event: string, data?: any) {
    this.#res.write(`event: ${event}\ndata: ${data}\n\n`);
    return true;
  }

  close() {
    this.#res.end();
  }
}
