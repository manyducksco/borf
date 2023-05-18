import { App, Router, html } from "@borf/server";

const app = new App({
  debug: {
    filter: "*",
  },
});
const PORT = process.env.PORT || 4000;

app.cors();
// app.fallback();
// app.fallback("/some/weird/place/index.html");
// app.static();
// app.static("/files", "/path/to/files/dir");

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

app.store(ExampleStore);
app.store(AsyncStore);

app.middleware(async (ctx, next) => {
  ctx.res.headers.set("X-MIDDLEWARE-OUTLINE", "mrrp");
  const start = performance.now();
  await next();
  const end = performance.now();
  ctx.res.headers.set("X-TIMER", end - start + "ms");
});

app.post(
  "/full-test",
  async (ctx, next) => {
    ctx.res.headers.set("X-MIDDLEWARE-INLINE", "RUFF");

    // Measure response time of subsequent handlers:
    const started = performance.now();
    await next();
    ctx.res.headers.set("X-RESPONSE-TIME-MS", performance.now() - started);
  },
  (ctx) => {
    const exampleStore = ctx.use(ExampleStore);
    const asyncStore = ctx.use(AsyncStore);

    ctx.res.headers.set(
      "X-GLOBAL-CALLS",
      `Example Store called ${exampleStore.call()} times.`
    );

    ctx.res.headers.set(
      "X-REQUEST-METHOD",
      `This is some CTX info: ${ctx.req.verb}.`
    );

    ctx.res.headers.set(
      "X-REQUEST-BODY",
      `This is some CTX info: ${ctx.req.body?.hello}.`
    );

    ctx.res.headers.set(
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

app.post("/form", ({ req, res }) => {
  console.log({ req, res });

  return "NOICE";
});

const r = new Router();
r.get("/test", () => {
  return "FROM ROUTER";
});

app.router(r);
app.router("/router", r);

app.get("/hello", () => {
  return "Hello world.";
});

app.get("/hello-json", () => {
  return {
    message: "Hello from the server!",
  };
});

app.get("/hello-html", function () {
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
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(html`<div class="container">${ctx.outlet()}</div>`);
    }, Math.random() * 300);
  })
  
}

// Listen for HTTP requests on localhost at specified port number.
app.start({ port: PORT }).then((info) => {
  console.log("started server", info);
});
