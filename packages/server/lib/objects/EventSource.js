import EventEmitter from "events";

export class EventSource {
  constructor(fn) {
    this.fn = fn;
  }

  /**
   * Prepare the response and run `fn` to start generating events.
   *
   * @param res - An instance of http.ServerResponse.
   */
  start(res) {
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

    this.fn(ctx);
  }
}

class EventSourceContext extends EventEmitter {
  #res = null;

  constructor(res) {
    super();
    this.#res = res;
  }

  send(data) {
    this.#res.write(`data: ${data}\n\n`);
  }

  emit(event, data) {
    this.#res.write(`event: ${event}\ndata: ${data}\n\n`);
    return true;
  }

  close() {
    this.#res.end();
  }
}
