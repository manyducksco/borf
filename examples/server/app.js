import { makeApp, makeRouter, html } from "@woofjs/server";

const app = makeApp();
const PORT = process.env.PORT || 4000;

app.cors();
app.static();
// app.static("/files", "/path/to/files/dir");
app.fallback();
// app.fallback("/some/weird/place/index.html");

const exampleService = function () {
  let timesCalled = 0;

  return {
    call: () => {
      timesCalled++;
      return timesCalled;
    },
  };
};

const asyncService = async function () {
  let waitFor = 50 + Math.random() * 100;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        call: () => {
          return waitFor;
        },
      });
    }, waitFor);
  });
};

app.service("example", exampleService);
app.service("async", asyncService);

app.use(async (ctx, next) => {
  ctx.response.headers.set("X-MIDDLEWARE-OUTLINE", "mrrp");
  const start = performance.now();
  await next();
  const end = performance.now();
  ctx.response.headers.set("X-TIMER", end - start + "ms");
});

app.post(
  "/full-test",
  (ctx, next) => {
    ctx.response.headers.set("X-MIDDLEWARE-INLINE", "RUFF");
    return next();
  },
  (ctx) => {
    const service = ctx.services.example;
    const asyncService = ctx.services.async;

    ctx.response.headers.set(
      "X-SERVICE-CALLS",
      `Example Service called ${service.call()} times.`
    );

    ctx.response.headers.set(
      "X-REQUEST-METHOD",
      `This is some CTX info: ${ctx.request.method}.`
    );

    ctx.response.headers.set(
      "X-REQUEST-BODY",
      `This is some CTX info: ${ctx.request.body?.hello}.`
    );

    ctx.response.headers.set(
      "X-SERVICE-ASYNC",
      `Async Service waited ${asyncService.call()} ms.`
    );

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: `Check the headers.`,
        });
      }, 50 + Math.random() * 100);
    });
  }
);

const router = makeRouter();
router.get("/test", () => {
  return "FROM ROUTER";
});

app.mount(router);
app.mount("/router", router);

app.get("/hello", (ctx) => {
  return "Hello world.";
});

app.get("/hello-json", () => {
  return {
    message: "Hello from the server!",
  };
});

app.get("/hello-html", function () {
  return html`
    <!DOCTYPE html>
    <head>
      <title>DEMO!</title>
    </head>
    <body>
      <div class="container">
        <h1>Title</h1>

        ${AsyncHeader(html`<p>This is a child</p>`)}
      </div>
    </body>
  `;
});

async function AsyncHeader(...children) {
  return html`<div class="container">${children}</div>`;
}

app.get("/timer", function (ctx) {
  // TODO: All events are emitted at once when the time ends.
  ctx.eventSource((events) => {
    let seconds = 10;

    events.emit("time", seconds);

    setInterval(() => {
      --seconds;

      if (seconds === 0) {
        events.send("Timer is up!");
        events.close();
      } else {
        events.emit("time", seconds);
      }
    }, 1000);
  });
});

// Listen for HTTP requests on localhost at specified port number.
app.listen(PORT).then((info) => {
  console.log(`connected on port ${info.port}`);
});
