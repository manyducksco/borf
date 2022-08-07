export class EventSource {
  /**
   *
   */
  constructor(fn, options = {}) {
    this.fn = fn;
    this.options = options;
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

    // Tell the client to retry every 10 seconds (by default) if connectivity is lost.
    // res.write(`retry: ${this.options.retryTimeout || 10000}\n\n`);

    res.on("close", () => {
      res.end();
    });

    const connection = {
      send(data) {
        res.write(`data: ${data}\n\n`);
      },
      emit(name, data) {
        res.write(`event: ${name}\ndata: ${data}\n\n`);
      },
      close() {
        res.end();
      },
    };

    this.fn(connection);
  }
}
