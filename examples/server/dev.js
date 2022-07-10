const { makeApp, makeRouter } = require("@woofjs/server");

const app = makeApp();

const exampleService = (self) => {
  return {
    call: () => {
      self.options.timesCalled++;
      return self.options.timesCalled;
    },
  };
};

app.service("example", exampleService, {
  options: {
    timesCalled: 0,
  },
});

app.use(async (ctx, next) => {
  const start = Date.now();
  ctx.response.headers["X-MIDDLEWARE-OUTLINE"] = "mrrp";
  await next();
  const end = Date.now();
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

    ctx.response.headers[
      "X-SERVICE-CALLS"
    ] = `Example Service called ${service.call()} times.`;

    ctx.response.headers[
      "X-REQUEST-METHOD"
    ] = `This is some CTX info: ${ctx.request.method}.`;

    ctx.response.headers[
      "X-REQUEST-BODY"
    ] = `This is some CTX info: ${ctx.request.body.hello}.`;

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
  return {
    message: `Hello world.`,
  };
});

// Listen for HTTP requests on localhost at specified port number.
app.listen(4000).then((info) => {
  console.log(`connected on port ${info.port}`);
});
