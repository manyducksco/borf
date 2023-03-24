import { App, Router, Store, html } from "@borf/server";

const app = new App({
  debug: {
    filter: "*",
  },
});
const PORT = process.env.PORT || 4000;

app.addCORS();
app.addStaticFiles();
// app.addStaticFiles("/files", "/path/to/files/dir");
app.addFallback();
// app.addFallback("/some/weird/place/index.html");

const ExampleStore = Store.define({
  label: "ExampleStore",
  setup: () => {
    let timesCalled = 0;

    return {
      call: () => {
        timesCalled++;
        return timesCalled;
      },
    };
  },
});

const AsyncStore = Store.define({
  label: "AsyncStore",
  setup: async () => {
    let waitFor = 50 + Math.random() * 100;
    return new Promise()((resolve) => {
      setTimeout(() => {
        resolve({
          call: () => {
            return waitFor;
          },
        });
      }, waitFor);
    });
  },
});

app.addStore(ExampleStore);
app.addStore(AsyncStore);

// app.use(async (ctx) => {
//   ctx.response.headers.set("X-MIDDLEWARE-OUTLINE", "mrrp");
//   const start = performance.now();
//   await ctx.next();
//   const end = performance.now();
//   ctx.response.headers.set("X-TIMER", end - start + "ms");
// });

app.onPost(
  "/full-test",
  (ctx) => {
    ctx.response.headers.set("X-MIDDLEWARE-INLINE", "RUFF");
    return ctx.next();
  },
  (ctx) => {
    const exampleGlobal = ctx.useStore(ExampleStore);
    const asyncGlobal = ctx.useStore(AsyncStore);

    ctx.response.headers.set(
      "X-GLOBAL-CALLS",
      `Example Global called ${exampleGlobal.call()} times.`
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
      "X-GLOBAL-ASYNC",
      `Async Global waited ${asyncGlobal.call()} ms.`
    );

    // ctx.setHeaders({
    //   "X-GLOBAL-CALLS": `Example Global called ${exampleGlobal.call()} times.`,
    //   "X-REQUEST-METHOD": `This is some CTX info: ${ctx.request.method}.`,
    //   "X-REQUEST-BODY": `This is some CTX info: ${ctx.request.body?.hello}.`,
    //   "X-GLOBAL-ASYNC": `Async Global waited ${asyncGlobal.call()} ms.`,
    // });

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: `Check the headers.`,
        });
      }, 50 + Math.random() * 100);
    });
  }
);

const router = new Router();
router.onGet("/test", () => {
  return "FROM ROUTER";
});

app.addRouter(router);
app.addRouter("/router", router);

app.onGet("/hello", (ctx) => {
  return "Hello world.";
});

app.onGet("/hello-json", () => {
  return {
    message: "Hello from the server!",
  };
});

app.onGet("/hello-html", function () {
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

// Listen for HTTP requests on localhost at specified port number.
app.start(PORT).then((info) => {
  console.log("started server", info);
});
