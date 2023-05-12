import { App, Router, html } from "@borf/server";

const app = new App({
  debug: {
    filter: "*",
  },
});
const PORT = process.env.PORT || 4000;

app.setCORS();
// app.setFallback();
// app.setFallback("/some/weird/place/index.html");
// app.addStaticFiles();
// app.addStaticFiles("/files", "/path/to/files/dir");

function ExampleStore() {
  let timesCalled = 0;

  return {
    call: () => {
      timesCalled++;
      return timesCalled;
    },
  };
}

async function AsyncStore() {
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
}

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
  async (ctx) => {
    ctx.response.headers.set("X-MIDDLEWARE-INLINE", "RUFF");

    // Measure response time of subsequent handlers:
    const started = performance.now();
    await ctx.next();
    ctx.response.headers.set("X-RESPONSE-TIME-MS", performance.now() - started);
  },
  ({ request, response, ...ctx }) => {
    const exampleStore = useStore(ExampleStore);
    const asyncStore = useStore(AsyncStore);

    response.headers.set(
      "X-GLOBAL-CALLS",
      `Example Store called ${exampleStore.call()} times.`
    );

    response.headers.set(
      "X-REQUEST-METHOD",
      `This is some CTX info: ${request.verb}.`
    );

    response.headers.set(
      "X-REQUEST-BODY",
      `This is some CTX info: ${req.body?.hello}.`
    );

    response.headers.set(
      "X-GLOBAL-ASYNC",
      `Async Store waited ${asyncStore.call()} ms.`
    );

    ctx.log("Console test");

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

app.onPost("/form", ({ request, response }) => {
  console.log({ request, response });

  return "NOICE";
});

const router = new Router();
router.onGet("/test", () => {
  return "FROM ROUTER";
});

app.addRoutes(router);
app.addRoutes("/router", router);

app.onGet("/hello", () => {
  return "Hello world.";
});

app.onGet("/hello-json", () => {
  return {
    message: "Hello from the server!",
  };
});

app.onGet("/hello-html", function () {
  return html`
    <head>
      <title>DEMO!</title>
    </head>
    <body>
      <div class="container">
        <h1>Title</h1>

        <${AsyncHeader}>
          <p>This is a child</p>
        </${AsyncHeader}>
      </div>
    </body>
  `;
});

async function AsyncHeader(_, ctx) {
  return html`<div class="container">${ctx.outlet()}</div>`;
}

// Listen for HTTP requests on localhost at specified port number.
app.start({ port: PORT }).then((info) => {
  console.log("started server", info);
});
