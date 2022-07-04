import { makeApp } from "@woofjs/server";

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

app.use((ctx) => {
  ctx.cache.bark = "mrrp";
});

app.get("/middleware-outline", (ctx) => {
  return {
    message: `Data from middleware: ${ctx.cache.bark}`,
  };
});

app.get(
  "/middleware-inline",
  (ctx) => {
    ctx.cache.meow = "RUFF";
  },
  (ctx) => {
    return {
      message: `Data from middleware: ${ctx.cache.meow}`,
    };
  }
);

app.get("/service", (ctx) => {
  const service = ctx.getService("example");
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
