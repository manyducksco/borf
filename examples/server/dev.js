const { makeApp } = require("@woofjs/server");

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
  ctx.cache.bark = "mrrp";
  await next();
  const end = Date.now();
  ctx.response.headers["X-TIMER"] = end - start + "ms";
});

app.get("/middleware-outline", async (ctx) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        message: `Data from middleware: ${ctx.cache.bark}`,
      });
    }, 50 + Math.random() * 100);
  });
});

app.get(
  "/middleware-inline",
  (ctx, next) => {
    ctx.cache.meow = "RUFF";
    return next();
  },
  (ctx) => {
    return {
      message: `Data from middleware: ${ctx.cache.meow}`,
    };
  }
);

app.get("/service", (ctx) => {
  const service = ctx.services.example;
  return {
    message: `Example Service called ${service.call()} times.`,
  };
});

app.get("/hello", (ctx) => {
  // An object returned from a route becomes a JSON body automatically.
  return {
    message: `This is some CTX info: ${ctx.request.method}.`,
  };
});

app.post("/hello", (ctx) => {
  // An object returned from a route becomes a JSON body automatically.
  ctx.response.status = 200;
  return {
    message: `This is some CTX info: ${ctx.request.body.hello}.`,
  };
});

// Listen for HTTP requests on localhost at specified port number.
app.listen(4000).then((info) => {
  console.log(`connected on port ${info.port}`);
});
