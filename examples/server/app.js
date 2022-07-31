const { makeApp, makeRouter } = require("@woofjs/server");

const app = makeApp();
const PORT = process.env.PORT || 4000;

const exampleService = (self) => {
  return {
    call: () => {
      self.options.timesCalled++;
      return self.options.timesCalled;
    },
  };
};

const asyncService = async (self) => {
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

app.service("example", exampleService, {
  options: {
    timesCalled: 0,
  },
});

app.service("async", asyncService);

app.use(async (ctx, next) => {
  ctx.response.headers["X-MIDDLEWARE-OUTLINE"] = "mrrp";
  const start = performance.now();
  await next();
  const end = performance.now();
  ctx.response.headers["X-TIMER"] = end - start + "ms";
});

app.post(
  "/full-test",
  (ctx, next) => {
    ctx.response.headers["X-MIDDLEWARE-INLINE"] = "RUFF";
    return next();
  },
  (ctx) => {
    const service = ctx.services.example;
    const asyncService = ctx.services.async;

    ctx.response.headers[
      "X-SERVICE-CALLS"
    ] = `Example Service called ${service.call()} times.`;

    ctx.response.headers[
      "X-REQUEST-METHOD"
    ] = `This is some CTX info: ${ctx.request.method}.`;

    ctx.response.headers[
      "X-REQUEST-BODY"
    ] = `This is some CTX info: ${ctx.request.body?.hello}.`;

    ctx.response.headers[
      "X-SERVICE-ASYNC"
    ] = `Async Service waited ${asyncService.call()} ms.`;

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

// Listen for HTTP requests on localhost at specified port number.
app.listen(PORT).then((info) => {
  console.log(`connected on port ${info.port}`);
});
