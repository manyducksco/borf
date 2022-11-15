import { makeApp, makeRouter, html } from "@woofjs/server";

const app = makeApp({
  debug: {
    filter: "*",
  },
});
const PORT = process.env.PORT || 4000;

app.cors();
app.static();
// app.static("/files", "/path/to/files/dir");
app.fallback();
// app.fallback("/some/weird/place/index.html");

const exampleGlobal = function () {
  let timesCalled = 0;

  return {
    call: () => {
      timesCalled++;
      return timesCalled;
    },
  };
};

const asyncGlobal = async function () {
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

app.global("example", exampleGlobal);
app.global("async", asyncGlobal);

app.use(async (ctx) => {
  ctx.response.headers.set("X-MIDDLEWARE-OUTLINE", "mrrp");
  const start = performance.now();
  await ctx.next();
  const end = performance.now();
  ctx.response.headers.set("X-TIMER", end - start + "ms");
});

app.post(
  "/full-test",
  (ctx) => {
    ctx.response.headers.set("X-MIDDLEWARE-INLINE", "RUFF");
    return ctx.next();
  },
  (ctx) => {
    const exampleGlobal = ctx.global("example");
    const asyncGlobal = ctx.global("async");

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

// Listen for HTTP requests on localhost at specified port number.
app.listen(PORT).then((info) => {
  console.log(`connected on port ${info.port}`);
});
